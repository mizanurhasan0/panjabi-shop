import { requireAdmin } from "@/lib/admin/auth";
import { getProduct, restockProduct } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    const { id } = await context.params;
    if (!getProduct(id)) throw new ApiError("Product not found.", 404);
    const { quantity } = await readJson(request);
    if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) throw new ApiError("Restock quantity must be between 1 and 100,000.");
    return restockProduct(id, quantity);
  });
}
