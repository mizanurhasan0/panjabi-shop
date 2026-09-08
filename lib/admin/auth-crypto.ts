import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const DUMMY_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(KEY_LENGTH)}`;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  const candidate = encoded ?? DUMMY_HASH;
  const [algorithm, salt, hash, extra] = candidate.split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "") || extra) {
    return false;
  }
  const derived = await deriveKey(password, salt);
  return timingSafeEqual(derived, Buffer.from(hash, "hex")) && Boolean(encoded);
}

export function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function equalSecret(candidate: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(digestToken(candidate), "hex"), Buffer.from(digestToken(expected), "hex"));
}
