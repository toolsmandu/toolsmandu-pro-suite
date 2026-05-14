## Why /admin takes ~10s today

I traced the load and found 3 issues stacking up:

**1. Auth gate blocks the whole layout**
`AdminLayout.tsx` shows only `"Loading..."` until `useAuth().loading === false`. `AuthProvider` waits for both `getSession()` AND `fetchUserData()` (roles + profile, sequential awaits inside `syncAuthState`) before flipping `loading` to false. On a cold load with token refresh this is the biggest contributor.

**2. AdminDashboard fires 6 separate Supabase queries on mount**
- `orders` (selects `status` for ALL 130 orders just to count by status)
- `products` count, `profiles` count, `blogs` count (3 separate round-trips)
- `profiles` created_at last-12-mo
- `customer_logins` last-12-mo (1,343 rows)
- `orders` last-12-mo

Each is a separate HTTP round-trip and they all start at once, competing for the same connection pool. Together they push first paint of dashboard content out by several seconds.

**3. ChatbotWidget + SalesStatsBar load with the layout bundle**
`ChatbotWidget` is imported eagerly by `AdminLayout` but only renders when opened — yet its code (Command, Popover, etc.) is in the layout's JS chunk.

## Fix plan

### A. Unblock the layout render (biggest win)
- In `AuthContext.tsx`: flip `loading=false` as soon as `getSession()` returns and we know whether a user exists. Fetch roles/profile in the background and expose them as they arrive. Add a separate `rolesLoading` flag for places that truly need it.
- In `AdminLayout.tsx`: only gate on `loading || rolesLoading` for the role check (redirect logic), but render the sidebar shell immediately.

### B. Slim down `AdminDashboard` queries
- Replace the "select all orders' status" query with parallel `head:true, count:'exact'` queries per status (or one RPC `get_admin_order_counts()` returning a JSON object). Same for the per-month buckets — push aggregation into a SQL function so we transfer a handful of rows instead of 1,300+.
- Add `staleTime: 60_000` to all dashboard `useQuery` calls so navigating away and back is instant.

### C. Lazy-load admin widgets
- Convert `ChatbotWidget` and `SalesStatsBar` / `EditorTaskStatsBar` imports in `AdminLayout.tsx` to `React.lazy` + `Suspense` with a tiny fallback. They're not needed for first paint.

### D. Cache the sidebar logo
- `site-logo-url` query in `AdminLayout` has no `staleTime`; add `staleTime: Infinity` (logo changes rarely) so it doesn't re-fetch on every navigation.

### Technical details
Files touched:
- `src/contexts/AuthContext.tsx` — split `loading` into `loading` (session known) and `rolesLoading` (profile/roles fetched).
- `src/pages/admin/AdminLayout.tsx` — render shell early; lazy-load ChatbotWidget/SalesStatsBar/EditorTaskStatsBar; add staleTime to logo query.
- `src/pages/admin/AdminDashboard.tsx` — switch to `count: 'exact', head: true` per status; add staleTime; (optional) add a Postgres RPC `admin_dashboard_stats()` for monthly aggregation.
- New migration (optional, only if RPC route is taken): SQL function returning monthly signup/active/order buckets in one call.

### Expected outcome
First meaningful paint of /admin drops from ~10s to ~1–2s. Dashboard widgets stream in progressively instead of blocking the whole shell.

## Out of scope
- No UI/visual redesign.
- No changes to admin business logic, RLS, or auth rules.
- No upgrade of the Cloud compute instance — fixing client query patterns first.
