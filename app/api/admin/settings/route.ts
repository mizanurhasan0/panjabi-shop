import { requireAdmin } from "@/lib/admin/auth";
import { getSettings, saveSettings } from "@/lib/admin/repository";
import { assertSameOrigin, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return withApi(async () => {
    await requireAdmin(request);
    return getSettings();
  });
}

export function PATCH(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    return saveSettings(await readJson(request));
  });
}
