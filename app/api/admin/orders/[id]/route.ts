import { requireAdmin } from "@/lib/admin/auth";
import { deleteOrder, getOrder, updateOrder } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, readJson, withApi } from "@/lib/admin/http";
import type { Order } from "@/lib/admin/types";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export function GET(request: Request, context: Context) {
  return withApi(async () => {
    await requireAdmin(request);
    const order = getOrder((await context.params).id);
    if (!order) throw new ApiError("Order not found.", 404);
    return order;
  });
}

export function PATCH(request: Request, context: Context) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    const { id } = await context.params;
    if (!getOrder(id)) throw new ApiError("Order not found.", 404);
    return updateOrder(id, await readJson<{ stage?: Order["stage"]; paymentStatus?: Order["paymentStatus"]; note?: string }>(request));
  });
}

export function DELETE(request: Request, context: Context) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    const { id } = await context.params;
    if (!getOrder(id)) throw new ApiError("Order not found.", 404);
    deleteOrder(id);
    return { success: true };
  });
}
