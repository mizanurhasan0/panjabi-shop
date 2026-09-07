import { getProductByHandle } from "./products";
import searchConfig from "./search-config.json";

// The asset importer uses this configuration too, so featured products survive refreshes.
export const popularSearchTerms = searchConfig.popularTerms;
export const mobileTrendingTerms = searchConfig.mobileTrendingTerms;
export const featuredSearchBadges = new Map(
  searchConfig.featuredProducts.map(({ handle, mobileBadge }) => [
    handle,
    mobileBadge,
  ]),
);
export const featuredSearchProducts = searchConfig.featuredProducts.flatMap(
  ({ handle }) => {
    const product = getProductByHandle(handle);
    return product ? [product] : [];
  },
);
