import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword, digestToken, equalSecret } from "../lib/admin/auth-crypto.ts";
import { ApiError, assertSameOrigin, readJson, withApi } from "../lib/admin/http.ts";

test("passwords use unique salts and only the matching password verifies", async () => {
  const first = await hashPassword("a long admin password");
  const second = await hashPassword("a long admin password");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("a long admin password", first), true);
  assert.equal(await verifyPassword("a different password", first), false);
  assert.equal(await verifyPassword("a long admin password"), false);
  assert.equal(await verifyPassword("password", "malformed"), false);
});

test("session and setup tokens are compared and stored through digests", () => {
  assert.equal(digestToken("a token").length, 64);
  assert.equal(equalSecret("same", "same"), true);
  assert.equal(equalSecret("short", "much longer"), false);
});

test("mutation origin checks reject missing and foreign origins", () => {
  const previous = process.env.APP_ORIGIN;
  delete process.env.APP_ORIGIN;
  try {
    assert.doesNotThrow(() => assertSameOrigin(new Request("https://shop.test/api", { headers: { origin: "https://shop.test" } })));
    assert.throws(() => assertSameOrigin(new Request("https://shop.test/api")), (error) => error.status === 403);
    assert.throws(() => assertSameOrigin(new Request("https://shop.test/api", { headers: { origin: "https://evil.test" } })), (error) => error.status === 403);
    process.env.APP_ORIGIN = "https://shop.test";
    assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3000/api", { headers: { origin: "https://shop.test" } })));
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test("JSON requests are bounded and must contain an object", async () => {
  const request = (body, headers = {}) => new Request("https://shop.test/api", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
  assert.deepEqual(await readJson(request('{"quantity":2}')), { quantity: 2 });
  await assert.rejects(() => readJson(request("[]")), (error) => error.status === 400);
  await assert.rejects(() => readJson(request("{")), (error) => error.status === 400);
  await assert.rejects(() => readJson(request('{"data":"123456"}'), 4), (error) => error.status === 413);
  await assert.rejects(() => readJson(request("{}", { "content-type": "text/plain" })), (error) => error.status === 415);
});

test("API errors return an explicit status and no-store envelope", async () => {
  const response = await withApi(() => { throw new ApiError("Please sign in.", 401); });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "Please sign in." });
});
