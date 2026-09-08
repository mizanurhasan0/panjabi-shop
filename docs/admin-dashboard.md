# Demo shop dashboard

Open `/admin` to explore the populated dashboard immediately. `/admin/login` offers an **Open demo dashboard** button. No account, password, setup token, database, or backend API is required.

## What you can try

- Daily, weekly, monthly and yearly sales/profit charts with clickable metrics.
- Product creation, editing, archiving, image selection and restocking.
- Catalog and customized orders, customer details, stage history, cancellation and returns.
- Order notifications, PDF invoices and actual Excel downloads.
- Shop name, logo, browser icon and contact settings.
- Browser snapshots, JSON download/import/restore and resetting the demo.
- Storefront cart and demo checkout, connected to the same browser workspace.

Sample products have purchase costs and varied inventory levels. Sample orders cover different dates and stages, so reports are populated from the first visit. All people and transactions are demonstration data.

## How data works

The shared store in `lib/demo/` keeps changes in this browser's local storage. Reloading retains the workspace; another browser starts with its own sample data. This is a UI prototype, not a production login or order system. No purchase, payment or customer notification is sent.

Use **Reset demo data** in Shop settings to restore the samples. Download a snapshot before resetting if you want to keep your edits. Backups are also local to the browser; downloaded JSON files can be imported on another browser. Restore replaces the current demo workspace after confirmation. Image selections are resized and stored locally.

Inventory is shared across a product's sizes/colors. Creating an order reserves stock; cancellation and return restore it once. Prices and costs are saved on each order line. Later product edits do not alter earlier orders. Actual delivery and additional expenses can be changed from order details without changing the customer's total.

Reports use Bangladesh time with Monday-starting weeks and order creation dates. Sales and gross profit count delivered orders, excluding fully refunded orders. Profit deducts saved product costs, delivery expense and additional expense from the order total. These are sample management figures, not accounting records.

## Code and verification

UI components use typed selectors and commands through `lib/demo/client.ts`, not a mock HTTP layer. The store, domain commands, sample generator, browser images and lazy-loaded downloads have separate responsibilities. Next.js renders the site; there are no application API routes or database connections.

Admin screens use Tailwind utilities. Repeated controls and responsive table layouts share recipes in `components/admin/styles.ts`; order layouts share `components/admin/orders/styles.ts`. Colors and animation keyframes are registered in the Tailwind theme in `app/globals.css`. There are no separate admin component stylesheets.

```sh
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

The PDF/Excel libraries load only when an export is requested. Bengali PDF fonts are served as local static assets. Motion respects reduced-motion preferences, and tables adapt to narrow screens.
