import { loginAdmin } from "@/lib/admin/auth";
import { assertSameOrigin, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    return loginAdmin(await readJson(request, 4096), request);
  });
}
