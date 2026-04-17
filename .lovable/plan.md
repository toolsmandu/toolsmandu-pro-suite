
The user's custom domain `web.toolsmandu.com` serves the static `public/robots.txt` file from the Lovable hosting layer. Editing content in the admin panel only updates the database, which is served by the edge function at `https://iuussfrylzowigmaozwv.supabase.co/functions/v1/robots-txt` — not at `web.toolsmandu.com/robots.txt`.

Lovable hosting serves static files from `public/` directly, and there's no way to proxy `/robots.txt` on the custom domain to the edge function (no `_redirects`, no `vercel.json` support on Lovable hosting).

## The fix

Since we can't redirect `/robots.txt` at the hosting layer, the practical solution is to **inject the dynamic robots.txt content into the app at build/runtime is not possible for a plain text file either**. Crawlers fetch `/robots.txt` as a static request — they won't run JS.

The only working approach on Lovable hosting:

**Approach: Sync the database value into `public/robots.txt` on save, so it's served at `web.toolsmandu.com/robots.txt`.**

But `public/robots.txt` is a file in the codebase — the running app cannot write to it. So this also won't work directly from the admin UI without a code change.

### Realistic working solutions

1. **Manual sync (simplest, immediate):** Admin edits in the UI → copies the saved content → pastes it into `public/robots.txt` via Lovable editor → republishes. Update the admin UI to make this clear, with a "Copy to clipboard" button and clear instructions.

2. **Remove `public/robots.txt` and accept that `/robots.txt` on the custom domain returns 404 or the SPA fallback** — bad for SEO. Not recommended.

3. **Use the edge function URL directly in Search Console** — submit `https://iuussfrylzowigmaozwv.supabase.co/functions/v1/robots-txt` as the robots reference. Crawlers won't auto-discover it though; they always look at `yourdomain.com/robots.txt`.

### Recommendation

Go with **Approach 1**: keep the dynamic edge function (useful as the source of truth + preview), and update the admin UI to:
- Show clearly that `web.toolsmandu.com/robots.txt` serves the static file from `public/robots.txt`
- Add a prominent "Copy content" button
- Add instructions: paste into `public/robots.txt` and republish

Also fix the current `public/robots.txt` which has a stray `ssss` line at the bottom.

## Plan

1. **Update `src/pages/admin/settings/AdminRobotsTxt.tsx`:**
   - Add a warning/info banner explaining custom domain limitation
   - Add a "Copy to clipboard" button next to Save
   - Show both URLs (edge function URL + custom domain static URL) with status notes
   - Add step-by-step instructions for syncing to `public/robots.txt`

2. **Clean up `public/robots.txt`** — remove the stray `ssss` line.

3. **No database or edge function changes** — the existing dynamic system stays as the source of truth and preview mechanism.
