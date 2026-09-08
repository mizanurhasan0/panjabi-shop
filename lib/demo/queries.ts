import type {
  AdminProduct,
  ListResult,
  Order,
  OrderStage,
  ReportPeriod,
} from "../admin/types.ts";
import { orderStages } from "../admin/types.ts";
import {
  enumValue,
  pagination,
  textValue,
  ValidationError,
} from "../admin/validation.ts";
import { summarizeOrders } from "../admin/reporting.ts";
import type { DemoSnapshot } from "./types.ts";

export interface ProductFilters {
  query?: string;
  page?: number;
  pageSize?: number;
  stock?: "low" | "out";
  includeInactive?: boolean;
}
export interface OrderFilters {
  query?: string;
  stage?: OrderStage;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}
function pageOf<T>(
  items: T[],
  filters: { page?: number; pageSize?: number },
): ListResult<T> {
  const { page, pageSize, offset } = pagination(filters.page, filters.pageSize);
  return {
    items: items.slice(offset, offset + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
export function getProduct(
  state: DemoSnapshot,
  id: string,
): AdminProduct | null {
  return (
    state.products.find(
      (product) => product.id === id || product.handle === id,
    ) ?? null
  );
}
export function listProducts(
  state: DemoSnapshot,
  filters: ProductFilters = {},
): ListResult<AdminProduct> {
  const query = textValue(filters.query, "Search", { max: 200 }).toLowerCase();
  return pageOf(
    state.products
      .filter(
        (product) =>
          (filters.includeInactive || product.active) &&
          (!query ||
            product.title.toLowerCase().includes(query) ||
            product.handle.toLowerCase().includes(query)) &&
          (filters.stock !== "out" || product.stock === 0) &&
          (filters.stock !== "low" ||
            product.stock <= product.lowStockThreshold),
      )
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
      ),
    filters,
  );
}
export function getOrder(state: DemoSnapshot, id: string): Order | null {
  return (
    state.orders.find((order) => order.id === id || order.number === id) ?? null
  );
}
export function listOrders(
  state: DemoSnapshot,
  filters: OrderFilters = {},
): ListResult<Order> {
  const query = textValue(filters.query, "Search", { max: 200 }).toLowerCase();
  const stage = filters.stage
    ? enumValue(filters.stage, orderStages, "Order stage")
    : null;
  const dates = [filters.from, filters.to].map((value) => {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      throw new ValidationError("Enter a valid date filter.");
    return date.toISOString();
  });
  return pageOf(
    state.orders
      .filter(
        (order) =>
          (!query ||
            [order.number, order.customerName, order.customerPhone].some(
              (value) => value.toLowerCase().includes(query),
            )) &&
          (!stage || order.stage === stage) &&
          (!dates[0] || order.createdAt >= dates[0]) &&
          (!dates[1] || order.createdAt < dates[1]),
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
      ),
    filters,
  );
}
export function getDashboardStats(
  state: DemoSnapshot,
  period: ReportPeriod,
  now = new Date(),
) {
  let totalProducts = 0;
  let lowStockProducts = 0;
  for (const product of state.products) {
    if (!product.active) continue;
    totalProducts++;
    if (product.stock <= product.lowStockThreshold) lowStockProducts++;
  }
  return {
    ...summarizeOrders(state.orders, period, now),
    totalProducts,
    lowStockProducts,
  };
}
