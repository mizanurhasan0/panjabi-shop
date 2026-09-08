import type { Order } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});
export function orderDate(value: string, time = false): string {
  const date = new Date(value);
  return `${dateFormatter.format(date)}${time ? ` · ${timeFormatter.format(date)}` : ""}`;
}

export function OrderTotals({
  order,
  showProfit = true,
}: {
  order: Pick<
    Order,
    | "subtotal"
    | "discount"
    | "shippingCharge"
    | "deliveryCost"
    | "additionalCost"
    | "total"
    | "profit"
  >;
  showProfit?: boolean;
}) {
  return (
    <dl className="order-totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatPrice(order.subtotal)}</dd>
      </div>
      <div>
        <dt>Discount</dt>
        <dd>−{formatPrice(order.discount)}</dd>
      </div>
      <div>
        <dt>Delivery charge</dt>
        <dd>{formatPrice(order.shippingCharge)}</dd>
      </div>
      <div className="order-total">
        <dt>Customer total</dt>
        <dd>{formatPrice(order.total)}</dd>
      </div>
      {showProfit && (
        <>
          <div>
            <dt>Delivery expense</dt>
            <dd>{formatPrice(order.deliveryCost)}</dd>
          </div>
          <div>
            <dt>Other expenses</dt>
            <dd>{formatPrice(order.additionalCost)}</dd>
          </div>
          <div className="order-profit">
            <dt>Estimated profit</dt>
            <dd>{formatPrice(order.profit)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

export function OrderLoading() {
  return (
    <div className="admin-stack" role="status" aria-label="Loading orders">
      <div className="admin-skeleton admin-skeleton-heading" />
      <div className="admin-skeleton admin-skeleton-table" />
      <span className="admin-sr-only">Loading orders…</span>
    </div>
  );
}
