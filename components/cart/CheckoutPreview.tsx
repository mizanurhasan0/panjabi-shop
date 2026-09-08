import Link from "next/link";

export function CheckoutPreview({
  layout,
  onRequest,
}: {
  layout: "drawer" | "page";
  onRequest?: () => void;
}) {
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
        Delivery is FREE nationwide. Pay with cash on delivery.
      </p>
      <Link
        href="/checkout"
        onClick={onRequest}
        className={
          isDrawer ? "cart-action cart-action-dark" : "btn-primary mt-6 w-full"
        }
      >
        Checkout
      </Link>
    </>
  );
}
