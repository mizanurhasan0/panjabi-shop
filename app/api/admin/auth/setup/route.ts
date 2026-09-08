import { setupAdmin } from "@/lib/admin/auth";
import { assertSameOrigin, json, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    return json(await setupAdmin(await readJson(request, 4096), request), 201);
  });
}
