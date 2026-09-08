import type { AdminProduct } from "@/lib/admin/types";

export interface DraftOrderLine {
  id: string;
  kind: "catalog" | "custom";
  product: AdminProduct | null;
  variantId: string;
  title: string;
  sku: string;
  variant: string;
  quantity: string;
  price: string;
  costPrice: string;
  customizations: string;
}

export function blankOrderLine(kind: DraftOrderLine["kind"]): DraftOrderLine {
  return {
    id: crypto.randomUUID(),
    kind,
    product: null,
    variantId: "",
    title: "",
    sku: "",
    variant: "",
    quantity: "1",
    price: "",
    costPrice: "0",
    customizations: "",
  };
}

export function draftAmounts(line: DraftOrderLine): {
  price: number;
  costPrice: number;
  quantity: number;
} {
  return {
    price: line.product
      ? (line.product.variants.find((variant) => variant.id === line.variantId)
          ?.price ?? line.product.price)
      : Number(line.price) || 0,
    costPrice: line.product?.costPrice ?? (Number(line.costPrice) || 0),
    quantity: Number(line.quantity) || 0,
  };
}

export interface DraftOrderCosts {
  shippingCharge: string;
  discount: string;
  deliveryCost: string;
  additionalCost: string;
}

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

/** Keep preview totals and combined stock checks independent of form rendering. */
export function summarizeDraftOrder(
  lines: DraftOrderLine[],
  costs: DraftOrderCosts,
) {
  let subtotal = 0;
  let itemCosts = 0;
  const quantities = new Map<string, number>();
  let stockProblem: AdminProduct | undefined;

  for (const line of lines) {
    const amounts = draftAmounts(line);
    subtotal += amounts.price * amounts.quantity;
    itemCosts += amounts.costPrice * amounts.quantity;
    if (line.product) {
      const quantity =
        (quantities.get(line.product.id) ?? 0) + amounts.quantity;
      quantities.set(line.product.id, quantity);
      if (!stockProblem && quantity > line.product.stock)
        stockProblem = line.product;
    }
  }

  subtotal = roundMoney(subtotal);
  const shippingCharge = Number(costs.shippingCharge) || 0;
  const discount = Number(costs.discount) || 0;
  const deliveryCost = Number(costs.deliveryCost) || 0;
  const additionalCost = Number(costs.additionalCost) || 0;
  const total = roundMoney(subtotal + shippingCharge - discount);

  return {
    stockProblem,
    summary: {
      subtotal,
      shippingCharge,
      discount,
      deliveryCost,
      additionalCost,
      total,
      profit: roundMoney(total - itemCosts - deliveryCost - additionalCost),
    },
  };
}
