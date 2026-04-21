

## Add "Publish SEO" Button to Admin Dashboard

Add a button on the admin dashboard that triggers a rebuild of static SEO pages by calling an edge function. Since the prerender edge function already serves fresh content from the database dynamically, the primary value of this button is to **purge Cloudflare's cached responses** so bots immediately see updated content after you add/edit products or blogs.

### How it works

1. Admin clicks "Publish SEO" on the dashboard
2. It calls a new edge function `purge-cloudflare-cache`
3. The edge function calls the Cloudflare API to purge the cache for `web.toolsmandu.com`
4. After purge, the next bot visit hits the prerender edge function which fetches fresh data from the database

This means: add a product → click "Publish SEO" → Google/Facebook/WhatsApp immediately see the new content.

### Implementation

**Step 1 — Add Cloudflare API secrets**

Two secrets needed:
- `CLOUDFLARE_ZONE_ID` — your domain's zone ID (found in Cloudflare dashboard → Overview)
- `CLOUDFLARE_API_TOKEN` — an API token with `Zone.Cache Purge` permission

**Step 2 — Create edge function `purge-cloudflare-cache`**

`supabase/functions/purge-cloudflare-cache/index.ts`

- Accepts POST requests from authenticated admin/editor users
- Calls `https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache` with `purge_everything: true`
- Returns success/failure status

**Step 3 — Update `AdminDashboard.tsx`**

Add a "Publish SEO" button (with a globe/refresh icon) to the dashboard header area. On click:
- Calls the edge function
- Shows a loading spinner while purging
- Shows a success/error toast

The button will appear next to the "Dashboard Overview" heading with a brief explanation: "Purge CDN cache so search engines see your latest changes."

### Files changed

- `supabase/functions/purge-cloudflare-cache/index.ts` — new edge function
- `src/pages/admin/AdminDashboard.tsx` — add Publish SEO button
- Two new secrets: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`

