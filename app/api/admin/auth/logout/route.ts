import { logoutAdmin } from "@/lib/admin/auth";
import { assertSameOrigin, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    await logoutAdmin(request);
    return { success: true };
  });
}
