"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import type { Product } from "@/lib/types";
import { formatPrice, getDefaultVariant } from "@/lib/utils/products";
import styles from "./CollectionProductCard.module.css";

export function CollectionProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, closeCart } = useCart();
  const variant = getDefaultVariant(product);
  const href = `/products/${product.handle}`;

  function addToCart() {
    if (!variant?.available) return;
    addItem(product, variant);
    closeCart();
    router.push("/cart");
  }

  return (
    <article className={styles.card} data-product-handle={product.handle}>
      <div className={styles.media}>
        <Link
          href={href}
          className={styles.imageLink}
          aria-label={product.title}
        >
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 991px) 50vw, 25vw"
            className={styles.primaryImage}
          />
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              fill
              sizes="(max-width: 991px) 50vw, 25vw"
              className={styles.secondaryImage}
            />
          )}
        </Link>
        {!product.available && <span className={styles.soldOut}>Sold Out</span>}
        <button
          type="button"
          className={styles.addButton}
          disabled={!variant?.available}
          onClick={addToCart}
          aria-label={`Add ${product.title} to cart`}
        >
          {variant?.available ? "Add to cart" : "Sold out"}
        </button>
      </div>
      <div className={styles.info}>
        <h2 className={styles.title}>
          <Link href={href}>{product.title}</Link>
        </h2>
        <p className={styles.price}>
          {product.priceFormatted}
          {product.compareAtPrice && (
            <del>{formatPrice(product.compareAtPrice)}</del>
          )}
        </p>
      </div>
    </article>
  );
}
