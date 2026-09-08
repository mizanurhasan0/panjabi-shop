import { requireAdmin } from "@/lib/admin/auth";
import { deleteProduct, getProduct, saveProduct } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return withApi(async () => {
    await requireAdmin(request);
    const product = getProduct((await context.params).id);
    if (!product) throw new ApiError("Product not found.", 404);
    return product;
  });
}

export function PATCH(request: Request, context: Context) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    const { id } = await context.params;
    if (!getProduct(id)) throw new ApiError("Product not found.", 404);
    return saveProduct(await readJson(request), id);
  });
}

export function DELETE(request: Request, context: Context) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    const { id } = await context.params;
    if (!getProduct(id)) throw new ApiError("Product not found.", 404);
    deleteProduct(id);
    return { success: true };
  });
}
