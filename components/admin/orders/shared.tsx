import type { Order } from "@/lib/admin/types";
import { formatPrice } from "@/lib/utils/products";
import { adminStyles } from "../styles";

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
    <dl className="m-0 grid gap-3.5 text-[11px] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-3.5 [&_dt]:text-admin-muted [&_dd]:m-0 [&_dd]:font-medium [&_dd]:whitespace-nowrap">
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
      <div className="my-[5px] border-y border-admin-line py-[18px] text-sm max-[641px]:text-[15px]">
        <dt className="font-medium text-admin-ink!">Customer total</dt>
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
          <div className="border-t border-dashed border-admin-line pt-3.5 text-[#528065]">
            <dt className="text-[#528065]!">Estimated profit</dt>
            <dd>{formatPrice(order.profit)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

export function OrderLoading() {
  return (
    <div
      className={adminStyles.stack}
      role="status"
      aria-label="Loading orders"
    >
      <div className={`${adminStyles.skeleton} mb-2 h-[42px] max-w-[300px]`} />
      <div className={`${adminStyles.skeleton} h-[380px]`} />
      <span className="sr-only">Loading orders…</span>
    </div>
  );
}
