export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  color: string;
  size: string;
  available: boolean;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  descriptionHtml: string;
  tags: string[];
  collectionHandle: string;
  price: number;
  priceMax: number;
  priceFormatted: string;
  compareAtPrice: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  available: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface CollectionMeta {
  handle: string;
  title: string;
  description?: string;
}

export interface CartItem {
  productHandle: string;
  variantId: string;
  quantity: number;
  color: string;
  size: string;
}

export interface CategoryTile {
  title: string;
  href: string;
  image: string;
}

export interface SlideItem {
  image: string;
  alt?: string;
  href?: string;
}

export type SortOption =
  | "availability"
  | "best-selling"
  | "title-asc"
  | "title-desc"
  | "price-asc"
  | "price-desc"
  | "date-desc"
  | "date-asc";
