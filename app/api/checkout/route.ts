import { consumeAuthAttempt } from "@/lib/admin/auth";
import { createOrder } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, json, readJson, requiredRecord, withApi } from "@/lib/admin/http";
import type { OrderInput } from "@/lib/admin/types";

export const runtime = "nodejs";

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) throw new ApiError("A valid checkout reference is required. Please refresh and try again.");
    const body = await readJson<OrderInput>(request, 64 * 1024);
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) throw new ApiError("Add between 1 and 100 items to your order.");
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    consumeAuthAttempt(`checkout:${customerPhone}`, 15);
    consumeAuthAttempt("checkout:global", 500);
    const input: OrderInput = {
      customerName: body.customerName,
      customerPhone,
      customerEmail: body.customerEmail,
      address: body.address,
      notes: body.notes,
      source: "storefront",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      items: body.items.map((value) => {
        const item = requiredRecord(value);
        if (typeof item.productId !== "string" || !item.productId || typeof item.variantId !== "string" || !item.variantId) throw new ApiError("Select a valid product and size for each item.");
        if (typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new ApiError("Item quantities must be between 1 and 100.");
        return { productId: item.productId, variantId: item.variantId, quantity: item.quantity, customizations: typeof item.customizations === "string" ? item.customizations : "" };
      }),
    };
    const order = createOrder(input, { storefront: true, idempotencyKey: key });
    return json({ id: order.id, number: order.number, stage: order.stage, total: order.total, customerName: order.customerName, createdAt: order.createdAt }, 201);
  });
}
