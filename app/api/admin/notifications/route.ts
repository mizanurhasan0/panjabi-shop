import { requireAdmin } from "@/lib/admin/auth";
import { listNotifications, markNotificationsRead } from "@/lib/admin/repository";
import { assertSameOrigin, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return withApi(async () => {
    await requireAdmin(request);
    return listNotifications();
  });
}

export function PATCH(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    markNotificationsRead();
    return { success: true };
  });
}
