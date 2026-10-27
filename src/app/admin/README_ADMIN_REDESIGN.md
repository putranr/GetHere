# GET-HERE Admin Redesign — installation

This archive contains the redesigned `src/app/admin` routes. It is intended to be copied into the existing GET-HERE Next.js project, replacing the current `src/app/admin` folder after taking a backup.

## Apply
1. Back up the current project folder `src/app/admin`.
2. Extract this archive at the root of the GET-HERE project so the included `src/app/admin/...` files merge into the matching paths.
3. Keep the existing `public/GetHere_Logo.png` file in place; the admin sidebar and login page reference it.
4. Run `npm run build` in the full project and test admin login, product CRUD, and order status changes locally before pushing.

## Included routes
- `/admin` — dashboard, greeting personalized with the login username, daily sales graph, actual API metrics, best-selling products, recent orders.
- `/admin/orders` — order search/filter and status actions using the existing `/api/orders` GET/PATCH API.
- `/admin/products` — retains the existing product management form and `/api/products` API.
- `/admin/categories` — displays the current Coffee/Non Coffee categories derived from product data. It does not pretend to create/delete categories because the supplied admin files did not include a category API or independent category model.
- `/admin/customers` — derives customer summaries from orders because no customer-specific endpoint was included in the supplied admin folder.
- `/admin/reports` — sales and product/category summaries based on orders with `paymentStatus === "PAID"`.
- `/admin/settings` — local browser preferences for notification display. These preferences are not server-side notifications.
- `/admin/login` — retains the existing login API flow and stores the entered username locally only for dashboard personalization; authentication remains with the existing API session/cookie.

The stock/low-stock panel is intentionally omitted to match the made-to-order delivery workflow described in the project brief.

## Scope note
The uploaded archive contained only the `admin` routes, not `package.json`, API route files, database schema, or the full project. All included TSX files passed TypeScript's TSX syntax transpilation check in this environment, but a full Next.js production build must be run in the actual project because its dependencies and API implementation were not included here.
