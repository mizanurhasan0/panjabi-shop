interface CheckoutPreviewProps {
  layout: "drawer" | "page";
  requested: boolean;
  onRequest: () => void;
}

export function CheckoutPreview({
  layout,
  requested,
  onRequest,
}: CheckoutPreviewProps) {
  const isDrawer = layout === "drawer";

  return (
    <>
      <p
        className={
          isDrawer
            ? "mb-4 text-ylw-text-secondary"
            : "mt-4 text-[13px] text-ylw-text-secondary"
        }
      >
        Taxes to be included at checkout. Delivery is FREE nationwide.
      </p>
      <button
        type="button"
        onClick={onRequest}
        className={
          isDrawer ? "cart-action cart-action-dark" : "btn-primary mt-6 w-full"
        }
      >
        Checkout
      </button>
      {requested && (
        <p
          role="status"
          className={
            isDrawer
              ? "mt-3 text-ylw-text-secondary"
              : "mt-3 text-[13px] text-ylw-text-secondary"
          }
        >
          Checkout is not available on this preview. Your cart is saved.
        </p>
      )}
    </>
  );
}
