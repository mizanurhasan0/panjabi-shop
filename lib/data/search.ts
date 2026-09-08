import searchConfig from "./search-config.json";

export const popularSearchTerms = searchConfig.popularTerms;
export const mobileTrendingTerms = searchConfig.mobileTrendingTerms;
export const featuredSearchBadges = new Map(
  searchConfig.featuredProducts.map(({ handle, mobileBadge }) => [
    handle,
    mobileBadge,
  ]),
);
