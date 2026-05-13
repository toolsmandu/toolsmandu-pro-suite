# Why the site loads slowly

I profiled your homepage and found the root cause:

- **9.4s page load**, **8.5s First Contentful Paint**, **240 script requests**, **3MB+ of JavaScript**.
- Your `src/App.tsx` statically imports **every page in the app** at the top — including ~60 admin pages and 4 dashboard pages — even though a visitor to `/` will never see them.
- That pulls heavy libraries (`recharts` 217KB, `xlsx` 184KB, `lucide-react` 191KB, rich text editor, etc.) into the homepage bundle.
- Result: a regular shopper downloads the entire admin panel before they see the first product.

Note: in the Lovable preview, Vite serves files un-bundled, so 240 separate requests look extreme. In production it will be lighter, but the underlying problem (no code splitting) still costs several seconds and megabytes.

# Plan — code splitting

## 1. Lazy-load every admin route
Convert all `import AdminX from "./pages/admin/..."` statements in `src/App.tsx` to `const AdminX = lazy(() => import("./pages/admin/..."))`. Wrap the `/admin` `<Route>` subtree in `<Suspense fallback={...}>` so Vite splits each admin page into its own chunk that only downloads when an admin actually visits `/admin/...`.

## 2. Lazy-load dashboard + secondary public pages
Same treatment for: `DashboardLayout`, `ProfilePage`, `OrdersPage`, `ReportProblemPage`, `InboxPage`, plus rarely-hit public pages: `BlogList`, `BlogPost`, `FreeTools`, `FreeToolDetail`, `Unsubscribe`, `PaymentVerify`, `PublicInboxPage`, `ForgotPassword`, `ResetPassword`, `Signup`, `Login`, `CartPage`, `SearchPage`.

Keep eagerly imported (needed for first paint of `/`):
`MainLayout`, `Index`, `ProductPage`, `CategoryPage`, `ScrollToTop`, `NotFound`.

## 3. Add a simple Suspense fallback
A small centered spinner using existing design tokens — no new dependency.

## 4. Fix CLS (0.20 → target <0.1)
The profile flagged layout shifts on the homepage container, header search form, and footer. After the bundle fix I'll verify CLS and, if still high, reserve explicit heights on the hero/category sections and add `width`/`height` on images that lack them.

## Expected impact
- Initial JS for `/` drops from ~3MB / 240 files to roughly 5–10 chunks.
- FCP should drop from **8.5s → ~1.5–2.5s** in production.
- Admin and dashboard load slightly slower on first visit (one extra chunk each), which is the correct tradeoff.

## Out of scope (can do later if needed)
- Migrating to the new Lovable SSR stack (would require a full rebuild — discussed earlier).
- Image optimization with `vite-imagetools`.
- Upgrading the Lovable Cloud instance size — only relevant if the database/edge functions become the bottleneck, which they currently aren't.

## Files touched
- `src/App.tsx` (the only file changed)
