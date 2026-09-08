import type { Product } from "@/lib/types";
import type { AdminProduct } from "./types";
import { defaultShopSettings, seededProducts } from "@/lib/demo/seed";

export function toPublicProduct(product: AdminProduct): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    tags: product.tags,
    collectionHandle: product.collectionHandle,
    price: product.price,
    priceMax: product.priceMax,
    priceFormatted: product.priceFormatted,
    compareAtPrice: product.compareAtPrice,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    variants: product.variants.map((variant) => ({
      ...variant,
      available: variant.available && product.stock > 0 && product.active,
    })),
    available: product.available && product.stock > 0 && product.active,
    isNew: product.isNew,
    createdAt: product.createdAt,
  };
}
export function getPublicShop() {
  return {
    products: seededProducts
      .filter((product) => product.active)
      .map(toPublicProduct),
    settings: defaultShopSettings,
  };
}
