import { IconHeart } from "../icons";

interface ProductActionsProps {
  available: boolean;
  wishlisted: boolean;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}

export function ProductActions({
  available,
  wishlisted,
  onAddToCart,
  onToggleWishlist,
}: ProductActionsProps) {
  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        disabled={!available}
        onClick={onAddToCart}
        className="btn-primary w-full"
      >
        {available ? "Add to cart" : "Sold out"}
      </button>
      <button
        type="button"
        onClick={onToggleWishlist}
        className="flex w-full items-center justify-center gap-2 border border-ylw-border py-3 text-[12px] uppercase tracking-[0.05em]"
      >
        <IconHeart filled={wishlisted} />
        {wishlisted ? "Added to wishlist" : "Add to wishlist"}
      </button>
      {available && (
        <button
          type="button"
          onClick={onAddToCart}
          className="btn-primary w-full bg-ylw-sale"
        >
          Buy it now
        </button>
      )}
    </div>
  );
}
