# Storefront comparison — 7 September 2026

Reference: https://www.yellowclothing.net/

Compared the rendered site in Chrome, including the desktop search overlay, mobile search drawer, empty cart drawer, header, homepage spacing and footer. The desktop search is supplied by a different reference-site widget from the mobile search; their layouts intentionally differ.

## Changes

- Desktop search: full-width top overlay, popular term and four matching featured products. Mobile search: left drawer, trending terms and horizontally scrolling products.
- Both searches use the catalog's shared matching function, support submission and show an empty result message.
- Cart controls open a right drawer: 420px on desktop and up to 350px on mobile. Adding a product opens the same drawer. Quantities, removals, totals, saved special instructions and persisted state are shared with the cart page; updates synchronize between tabs. The populated layout now uses the reference thumbnail sizes, unit prices and bottom summary.
- Native dialogs handle focus containment, Escape, backdrop dismissal and scroll locking. Mobile navigation closes after following a link.
- Corrected the mobile header height, bag icon, navigation height, font variable, hero gutters, slide order, category labels, brand section and footer layout. All three mobile footer sections collapse; brand links scroll horizontally and remain keyboard accessible. Carousels support swipe and reduced motion.
- Removed obsolete drawer CSS and fixed the shared container rule that overrode vertical spacing utilities.
- Featured products are configured in `lib/data/search-config.json`. The asset importer reads the same configuration, so catalog refreshes retain those products.
- Footer information and policy links use the original site's pages because those pages are not implemented locally.
- The follow-up review ran search/header, cart/dialog and homepage/footer work in three parallel agents, with shared CSS integration and final checks handled centrally.
- Fixed a confirmed product-page render loop in recently viewed history. History now preserves earlier entries, validates stored data and renders from hydration-safe state.
- Size counts now reflect available matching products, counting a product once per size even when multiple colors are available.

## Verification

Passed production build, TypeScript and ESLint checks. Chrome checks covered:

- Search opening, matching, empty results, Enter submission and loaded featured images.
- Cart opening, adding, increasing/decreasing, removing and persistence after reload.
- Escape, focus restoration, focus containment, backdrop dismissal and scroll unlock.
- Mobile menu navigation, 350px mobile drawer geometry and no page overflow at 320px.
- Desktop and mobile screenshots at 1440px and 390px. No page JavaScript errors in the interaction checks. The integrated search, cart, homepage and product-history browser checks were also rerun in parallel after merging the agents' work.
- Product-page console checks after allowing effects to settle: no repeated-render errors, and valid history survives reload while malformed saved history is handled.
- `npm run test:unit` checks size-count/filter consistency and combined size/price filtering (run with Node 24).

## Scope

This is a local catalog implementation. Live stock synchronization, account authentication, the reference inline cart variant editor and payment/checkout backend integration are not implemented. Checkout buttons announce that checkout is unavailable in this preview. This review does not establish pixel-for-pixel parity across every collection, product or account page, or every state of the live site's third-party widgets.

## Cart animation follow-up

Measured the live drawer's computed styles and frame-by-frame positions on desktop and mobile, then replaced the generic 200ms fade:

- Drawer: `translateX(101%)` to `0`, `500ms ease`, in both directions; panel opacity stays at 1.
- Backdrop: `rgba(35, 35, 35, 0.8)`, opacity transition over `500ms ease`.
- At widths of at least 1025px, the header/main/footer wrapper shifts 64px left. Drawer header and content enter from 40px right with 250ms and 550ms opening delays respectively. Closing has no delay. Mobile omits these desktop effects.
- The native dialog stays open and the background stays locked until the exit transition finishes. Interrupted exits reverse without a stale completion closing the reopened drawer.
- Reduced motion removes both duration and stagger delays. Browser assertions passed for exact CSS timing, intermediate positions, full opening/closing, focus restoration, scroll unlocking and interrupted reopen. Build and lint passed.

## Fall 2026 collection follow-up

Reference: https://www.yellowclothing.net/collections/fall-2026 (rendered Chrome page).

- Added the original 2560×1000 collection banner with its uncropped responsive ratio. Measured bounds match the reference at 390px, 768px and 1440px viewport widths.
- Replaced the black filter bar with outlined desktop Product Type, Size and Price controls and the separate sort menu. Mobile uses Filter By, a left filter drawer, expandable groups and a result-count button. Selections combine across groups and can be individually removed or cleared together.
- Added collection-specific cards and grid styles: contained images inside 140% image wrappers, reference gutters and spacing, always-visible mobile cart buttons and desktop hover controls. Card links and buttons are separate interactive elements. Collection Add to cart follows the reference by adding the first available variant and navigating to the cart page; the header cart still opens its drawer.
- Refreshed all 101 Fall products, including 48 products missing from the local catalog, with 96 new local images. The first four products match the rendered reference's newest-first order. Other collection memberships remain unchanged.
- Product lists load in 20-item batches when scrolled. Filter/sort changes reset the batch. The asset importer supports paginated, scoped refreshes: `npm run fetch-assets -- --collection fall-2026`.
- Unit tests cover combined product-type/size/price filtering. Chrome checks cover initial order, incremental loading, sort reset, mobile cart navigation/persistence and no horizontal overflow from 320px to 1440px. No page JavaScript errors occurred. Production build, TypeScript and ESLint passed. Filter browser checks also passed for size search and selection, product type, numeric price, sort dismissal, clear-all, mobile drawer geometry, Escape and focus restoration. The mobile filter drawer uses the measured 200ms ease-in-out slide and respects reduced motion.

Catalog data is a local snapshot; subsequent live inventory/catalog changes require a refresh.

## Panjabi Shop image update

At the user's request, selected images from https://www.panjabishop.com/ replace the homepage hero slides, Fall collection banner and six men's Panjabi galleries. The source page and original photo URLs are recorded in `lib/data/panjabishop-images.json`.

- Three 1750×700 campaign banners retain their original proportions. Six products have two or three distinct photos, with model photos first and detail/packaging photos after them.
- Nineteen local WebP files total approximately 2.8 MiB. Product photos are resized to at most 1200px wide. The gallery contains square photos without cropping and exposes labeled thumbnail controls.
- `npm run fetch-panjabishop-images` downloads missing assets and reapplies the configured image selections. The existing catalog importer also preserves those selections. Product names, variants, pricing and collection membership are unchanged.
- Verified all six galleries at 390px and 1440px, next/thumbnail controls, collection hover images, asset decoding, homepage slides and links. No page errors or horizontal overflow. Production build and ESLint passed; catalog comparison confirms that only configured image arrays changed.

## Complete product catalog replacement

The user clarified that every product card should use Panjabi Shop products and photographs. The earlier six image overrides left most of the original catalog visible, including all four leading collection cards. The active catalog now contains 31 Panjabi Shop products with 62 distinct product photos, replacing the previous 226-product catalog.

- Product names, colors, current/previous prices, sizes and variant availability come from the recorded public source data in `lib/data/panjabishop-catalog.json`. Original image and page URLs remain in `panjabishop-images.json`. Exact duplicate photos are removed during import; genuine single-photo galleries remain single-photo galleries.
- Home arrivals, all collection cards, featured search/results, related products, wishlist and cart read the same canonical products. Home categories, promotional images and navigation now match the source taxonomy. Printed Panjabi, Luxury Panjabi and Watches were empty in the source listings at inspection and remain empty locally.
- `npm run fetch-assets` and `npm run fetch-panjabishop-images` rebuild the active catalog from that recorded snapshot and download missing source images. They no longer reintroduce the old YELLOW product catalog. Update the source snapshot to refresh inventory; this is not live stock synchronization.
- Retired wishlist handles are filtered during hydration, matching the cart's existing handling of retired products. The product detail price displays the source price without an unsupported extra VAT suffix.
- Verification: all five unit checks passed; desktop/mobile Chrome checks passed for home content, featured search, queries, collection cards, product title/gallery, cart photos and reload persistence, wishlist migration and responsive layouts. No old product-image paths remain on the checked shopping routes and no browser errors occurred. Production build and lint passed.

## Header usability redesign

Redesigned the user-selected top header independently of the reference site's original stacked utilities. The desktop row now places the logo, a prominent search field and account/wishlist/cart actions together. Mobile uses a centered brand row with menu, wishlist and cart controls plus a full-width search row; account links remain available in the mobile menu on small screens.

- The search field submits directly to search results. Its suggestion button and ArrowDown open the existing search dialog with the current query; edits synchronize back, and closing restores focus. Added a clear control and composition-safe keyboard handling.
- Added visible focus outlines, explicit menu/dialog relationships, larger action targets and compact count badges. Cart counts above 99 display 99+ while their accessible label retains the full count.
- Replaced obsolete top-header global rules with scoped `Header.module.css`; retained navigation and existing dialog behavior. Submenu Escape now closes the menu and restores focus without reopening it.
- Chrome checks passed from 320px to 1744px for layout, direct search, query synchronization, menu/cart dismissal and focus. Additional checks covered 125-item cart counts, non-overlapping mobile logo/actions and keyboard submenu dismissal. Production build, TypeScript and ESLint passed.
