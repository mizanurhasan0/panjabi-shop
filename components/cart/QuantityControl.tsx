import { IconMinus, IconPlus } from "../icons";

interface QuantityControlProps {
  quantity: number;
  label: string;
  layout: "drawer" | "page";
  onChange: (quantity: number) => void;
}

export function QuantityControl({
  quantity,
  label,
  layout,
  onChange,
}: QuantityControlProps) {
  const isDrawer = layout === "drawer";

  return (
    <div
      className={
        isDrawer ? "cart-quantity" : "flex items-center border border-ylw-border"
      }
      role="group"
      aria-label={`Quantity for ${label}`}
    >
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        className={isDrawer ? undefined : "px-2 py-1"}
        onClick={() => onChange(quantity - 1)}
      >
        <IconMinus className="h-3 w-3" />
      </button>
      <span
        className={isDrawer ? undefined : "px-3 text-[12px]"}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        className={isDrawer ? undefined : "px-2 py-1"}
        onClick={() => onChange(quantity + 1)}
      >
        <IconPlus className="h-3 w-3" />
      </button>
    </div>
  );
}
