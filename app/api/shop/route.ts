import { getPublicShop } from "@/lib/admin/public-shop";
import { withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function GET() {
  return withApi(() => getPublicShop());
}
