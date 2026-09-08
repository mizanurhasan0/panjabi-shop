import { requireAdmin } from "@/lib/admin/auth";
import { createOrder, listOrders } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, json, queryInteger, readJson, withApi } from "@/lib/admin/http";
import { orderStages, type OrderInput, type OrderStage } from "@/lib/admin/types";

export const runtime = "nodejs";

export function GET(request: Request) {
  return withApi(async () => {
    await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const stage = params.get("stage");
    if (stage && !orderStages.includes(stage as OrderStage)) throw new ApiError("Invalid order stage.");
    const from = params.get("from") || undefined;
    const to = params.get("to") || undefined;
    for (const date of [from, to]) if (date && !Number.isFinite(Date.parse(date))) throw new ApiError("Invalid order date filter.");
    return listOrders({ query: params.get("query") || undefined, stage: stage ? stage as OrderStage : undefined, page: queryInteger(params.get("page"), 1, 100000), pageSize: queryInteger(params.get("pageSize"), 20, 100), from, to });
  });
}

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    return json(createOrder(await readJson<OrderInput>(request)), 201);
  });
}
