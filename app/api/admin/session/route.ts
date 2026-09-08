import { getAdmin, isSetupEnabled, needsAdminSetup } from "@/lib/admin/auth";
import { withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return withApi(async () => ({ user: await getAdmin(request), needsSetup: needsAdminSetup(), setupEnabled: isSetupEnabled() }));
}
