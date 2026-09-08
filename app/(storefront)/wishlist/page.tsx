"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/store/wishlist";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { getProducts, count } = useWishlist();
  const wishlistProducts = getProducts();

  return (
    <div className="container-ylw pb-16">
      <h1 className="py-10 text-center text-[24px] font-normal uppercase tracking-[0.1em]">
        My Wish List
      </h1>

      {count === 0 ? (
        <div className="py-8 text-center">
          <p className="mb-6 text-[14px] text-ylw-text-secondary">
            Your wish list is empty
          </p>
          <Link href="/" className="btn-outline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
