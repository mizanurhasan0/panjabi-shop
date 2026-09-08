# Panjabi Shop

A responsive storefront built with Next.js 16, React 19, TypeScript and Tailwind CSS 4. It includes collections, search, product galleries, a persistent cart, wishlist and recently viewed products.

## Development

Use Node.js 22.18+ (the unit tests import TypeScript directly) and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Before changing Next.js APIs, read the relevant installed documentation in `node_modules/next/dist/docs/`, as required by `AGENTS.md`.

## Validation

```sh
pnpm lint
pnpm test:unit
pnpm exec tsc --noEmit
pnpm build
```

The first build or development run generates Next.js route types used by the pages. Production builds fetch the Poppins font through `next/font/google`, so they need access to Google Fonts.

## Code organization

- `app/`: route entry points, metadata and global styles.
- `components/`: storefront views and shared UI. Feature folders contain the smaller pieces used by filters, product cards and product details.
- `lib/data/`: catalog snapshots, generated storefront data, query functions and merchandising content. Keep query logic separate from generated catalog data.
- `lib/store/`: cart, wishlist and recently viewed state. Storage access and hydration are shared; shopping remains usable if browser storage is unavailable.
- `lib/hooks/`: browser behavior shared by UI components, including native dialog lifecycle and scroll locking.
- `lib/utils/`: pure product formatting, filtering and sorting functions.
- `scripts/`: repeatable catalog and image import tooling.
- `tests/`: Node test runner regression tests.

Keep route-specific composition in pages and feature views. Extract components when they share behavior or have a distinct responsibility, while retaining their existing styles and accessible labels.

## Catalog refresh

The recorded source is `lib/data/panjabishop-catalog.json`; image provenance is stored in `lib/data/panjabishop-images.json`. The importer writes `lib/data/catalog.generated.json`; `lib/data/products.ts` contains the hand-written query API.

```sh
pnpm fetch-assets
```

This rebuilds storefront catalog data and downloads missing source images. `pnpm fetch-panjabishop-images` is a compatibility command for the same refresh. Review generated changes and run the tests before accepting a refreshed catalog. Do not hand-edit generated catalog data.

## Preview behavior

Account forms and stock notifications show local demo confirmations. Checkout displays a preview message; no payment, authentication or order backend is connected. Cart contents, order notes, wishlist and recently viewed products are stored in the browser.
