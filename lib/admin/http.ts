export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function json<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export function apiError(error: unknown): Response {
  const expected = error instanceof ApiError || (error instanceof Error && error.name === "ValidationError");
  const status = error instanceof ApiError ? error.status : expected ? 400 : 500;
  if (!expected) console.error("Admin request failed:", error);
  return Response.json({ error: expected ? (error as Error).message : "Something went wrong. Please try again." }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function withApi(handler: () => unknown | Promise<unknown>): Promise<Response> {
  try {
    const result = await handler();
    return result instanceof Response ? result : json(result);
  } catch (error) {
    return apiError(error);
  }
}

/** Mutating browser requests must originate at this application. */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.APP_ORIGIN;
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(configuredOrigin || request.url).origin;
  } catch {
    throw new ApiError("The application origin is not configured correctly.", 500);
  }
  if (!origin || origin !== allowedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError("This request must come from this shop.", 403);
  }
}

export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = 1024 * 1024): Promise<T> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError("Send the request as JSON.", 415);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new ApiError("The request is too large.", 413);
  if (!request.body) throw new ApiError("The request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new ApiError("The request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
    return value as T;
  } catch {
    throw new ApiError("The request contains invalid JSON.");
  }
}

export function queryInteger(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) throw new ApiError("Invalid page or page size.");
  return number;
}

export function requiredRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError("Invalid request details.");
  return value as Record<string, unknown>;
}
