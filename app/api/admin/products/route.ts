import { requireAdmin } from "@/lib/admin/auth";
import { listProducts, saveProduct } from "@/lib/admin/repository";
import { ApiError, assertSameOrigin, json, queryInteger, readJson, withApi } from "@/lib/admin/http";

export const runtime = "nodejs";

export function GET(request: Request) {
  return withApi(async () => {
    await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const stock = params.get("stock");
    if (stock && stock !== "low" && stock !== "out") throw new ApiError("Invalid stock filter.");
    return listProducts({ query: params.get("query") || undefined, page: queryInteger(params.get("page"), 1, 100000), pageSize: queryInteger(params.get("pageSize"), 20, 100), stock: stock === "low" || stock === "out" ? stock : undefined, includeInactive: params.get("includeInactive") !== "false" });
  });
}

export function POST(request: Request) {
  return withApi(async () => {
    assertSameOrigin(request);
    await requireAdmin(request);
    return json(saveProduct(await readJson(request)), 201);
  });
}
