import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { digestToken, equalSecret, hashPassword, verifyPassword } from "./auth-crypto";
import { ApiError, requiredRecord } from "./http";
import type { AdminUser } from "./types";

const SESSION_COOKIE = "panjabi_admin_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const RATE_WINDOW_SECONDS = 15 * 60;

function authDb() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY, owner_slot INTEGER NOT NULL UNIQUE DEFAULT 1 CHECK(owner_slot = 1),
      name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS admin_auth_limits (
      bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, started_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function needsAdminSetup(): boolean {
  return !authDb().prepare("SELECT id FROM admin_users LIMIT 1").get();
}

export function isSetupEnabled(): boolean {
  return Boolean(process.env.ADMIN_SETUP_TOKEN?.trim());
}

/** Persisted limits work across app restarts and concurrent worker processes. */
export function consumeAuthAttempt(bucket: string, limit: number, windowSeconds = RATE_WINDOW_SECONDS): void {
  const db = authDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare("DELETE FROM admin_auth_limits WHERE started_at < ?").run(now - 24 * 60 * 60);
  const row = db.prepare(`
    INSERT INTO admin_auth_limits (bucket, attempts, started_at) VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      attempts = CASE WHEN started_at <= ? THEN 1 ELSE attempts + 1 END,
      started_at = CASE WHEN started_at <= ? THEN excluded.started_at ELSE started_at END
    RETURNING attempts
  `).get(digestToken(bucket), now, now - windowSeconds, now - windowSeconds) as { attempts: number };
  if (row.attempts > limit) throw new ApiError("Too many attempts. Please try again in 15 minutes.", 429);
}

function credentials(input: unknown, setup = false) {
  const body = requiredRecord(input);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError("Enter a valid email address.");
  if (!password || password.length > 128 || (setup && password.length < 12)) {
    throw new ApiError(setup ? "Use a password with 12 to 128 characters." : "Enter your password.");
  }
  return { body, email, password };
}

function requestIsSecure(request: Request): boolean {
  return new URL(process.env.APP_ORIGIN || request.url).protocol === "https:";
}

async function startSession(user: AdminUser, request: Request): Promise<AdminUser> {
  const db = authDb();
  const token = randomBytes(32).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").run(now);
  db.prepare("INSERT INTO admin_sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(digestToken(token), user.id, now + SESSION_SECONDS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: requestIsSecure(request), sameSite: "strict", path: "/", maxAge: SESSION_SECONDS,
  });
  return user;
}

export async function setupAdmin(input: unknown, request: Request): Promise<AdminUser> {
  consumeAuthAttempt("setup", 10);
  const expectedToken = process.env.ADMIN_SETUP_TOKEN?.trim();
  if (!expectedToken) throw new ApiError("Ask the server owner to configure ADMIN_SETUP_TOKEN before creating the admin account.", 403);
  const { body, email, password } = credentials(input, true);
  const suppliedToken = typeof body.setupToken === "string" ? body.setupToken : "";
  if (!equalSecret(suppliedToken, expectedToken)) throw new ApiError("The setup token is incorrect.", 403);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) throw new ApiError("Enter an admin name with 1 to 100 characters.");
  if (!needsAdminSetup()) throw new ApiError("An administrator has already been created. Please sign in.", 409);
  const passwordHash = await hashPassword(password);
  const db = authDb();
  const user: AdminUser = { id: randomUUID(), name, email };
  // The unique owner slot makes setup atomic even if two requests hash concurrently.
  const inserted = db.prepare("INSERT OR IGNORE INTO admin_users(id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, name, email, passwordHash, Math.floor(Date.now() / 1000));
  if (Number(inserted.changes) !== 1) throw new ApiError("An administrator has already been created. Please sign in.", 409);
  return startSession(user, request);
}

export async function loginAdmin(input: unknown, request: Request): Promise<AdminUser> {
  consumeAuthAttempt("login:global", 100);
  const { email, password } = credentials(input);
  consumeAuthAttempt(`login:${email}`, 10);
  const row = authDb().prepare("SELECT id, name, email, password_hash FROM admin_users WHERE email = ?").get(email) as (AdminUser & { password_hash: string }) | undefined;
  const valid = await verifyPassword(password, row?.password_hash);
  if (!row || !valid) throw new ApiError("The email or password is incorrect.", 401);
  authDb().prepare("DELETE FROM admin_auth_limits WHERE bucket = ?").run(digestToken(`login:${email}`));
  return startSession({ id: row.id, name: row.name, email: row.email }, request);
}

async function sessionToken(request?: Request): Promise<string | undefined> {
  if (!request) return (await cookies()).get(SESSION_COOKIE)?.value;
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}

export async function getAdmin(request?: Request): Promise<AdminUser | null> {
  const token = await sessionToken(request);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = authDb().prepare(`
    SELECT u.id, u.name, u.email FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(digestToken(token), Math.floor(Date.now() / 1000)) as AdminUser | undefined;
  return row ? { id: row.id, name: row.name, email: row.email } : null;
}

export async function requireAdmin(request?: Request): Promise<AdminUser> {
  const user = await getAdmin(request);
  if (!user) throw new ApiError("Please sign in to continue.", 401);
  return user;
}

export async function logoutAdmin(request: Request): Promise<void> {
  const token = await sessionToken(request);
  if (token) authDb().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(digestToken(token));
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: requestIsSecure(request), sameSite: "strict", path: "/", maxAge: 0 });
}
