import { useAdminLanguage } from "@/lib/admin/i18n";
import type { Order } from "@/lib/admin/types";
import { adminStyles } from "../styles";

export const paymentMethodLabels = {
  cod: "Cash on delivery",
  cash: "Cash",
  mobile: "Mobile banking",
  bank: "Bank transfer",
} satisfies Record<Order["paymentMethod"], string>;

const subtotalRows = [
  { key: "subtotal", label: "Subtotal" },
  { key: "discount", label: "Discount" },
  { key: "shippingCharge", label: "Delivery charge" },
] as const;

const expenseRows = [
  { key: "deliveryCost", label: "Delivery expense" },
  { key: "additionalCost", label: "Other expenses" },
] as const;

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
  const { t, formatCurrency } = useAdminLanguage();
  return (
    <dl className="m-0 grid gap-3.5 text-[11px] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-3.5 [&_dt]:text-admin-muted [&_dd]:m-0 [&_dd]:font-medium [&_dd]:whitespace-nowrap">
      {subtotalRows.map(({ key, label }) => (
        <div key={key}>
          <dt>{t(label)}</dt>
          <dd>
            {key === "discount" ? "−" : ""}
            {formatCurrency(order[key])}
          </dd>
        </div>
      ))}
      <div className="my-[5px] border-y border-admin-line py-[18px] text-sm max-[641px]:text-[15px]">
        <dt className="font-medium text-admin-ink!">{t("Customer total")}</dt>
        <dd>{formatCurrency(order.total)}</dd>
      </div>
      {showProfit && (
        <>
          {expenseRows.map(({ key, label }) => (
            <div key={key}>
              <dt>{t(label)}</dt>
              <dd>{formatCurrency(order[key])}</dd>
            </div>
          ))}
          <div className="border-t border-dashed border-admin-line pt-3.5 text-[#528065]">
            <dt className="text-[#528065]!">{t("Estimated profit")}</dt>
            <dd>{formatCurrency(order.profit)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

export function OrderLoading() {
  const { t } = useAdminLanguage();
  return (
    <div
      className={adminStyles.stack}
      role="status"
      aria-label={t("Loading orders")}
    >
      <div className={`${adminStyles.skeleton} mb-2 h-[42px] max-w-[300px]`} />
      <div className={`${adminStyles.skeleton} h-[380px]`} />
      <span className="sr-only">{t("Loading orders…")}</span>
    </div>
  );
}
