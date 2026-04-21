

## The SEO problem

Your site is a **client-rendered React SPA**. When Google or anyone hits "View Page Source", they only see the empty shell in `index.html` — no product titles, no blog content, no per-page meta tags. Everything is injected by JavaScript after load.

Google *can* execute JavaScript, but:
- It's slower, less reliable, and lower-priority than server-rendered HTML
- Social previews (Facebook, WhatsApp, Twitter, LinkedIn) **do not run JS** — they only read raw HTML, so your share cards are always the generic homepage info
- Per-page meta titles/descriptions you set in `BlogPost.tsx` etc. via `document.title` never appear in the source

Lovable hosts static SPAs only — true SSR (Next.js style) is not available here. So the fix is a **prerendering strategy** that runs inside the constraints of Lovable hosting.

## Recommended solution: Dynamic prerendering edge function + react-helmet-async

A two-layer approach that gives crawlers real HTML while keeping the app a normal SPA for users.

### Layer 1 — Per-page meta tags with `react-helmet-async`

Replace the manual `document.title` / `document.querySelector('meta')` code in `BlogPost.tsx` (and add to `ProductPage.tsx`, `CategoryPage.tsx`, `Index.tsx`, `BlogList.tsx`) with `<Helmet>` blocks. This:
- Centralizes SEO tags per page (title, description, canonical, OG, Twitter, JSON-LD)
- Lets Google's JS-capable crawler pick them up reliably
- Provides the source of truth that the prerender layer (below) will read

### Layer 2 — Prerender edge function for bots

Add a Supabase edge function `prerender` that:
1. Detects if the request is a known crawler (Googlebot, Bingbot, facebookexternalhit, Twitterbot, WhatsApp, LinkedInBot, Slackbot, Discordbot, etc.) via User-Agent
2. For product/blog/category routes, fetches the data directly from the database
3. Injects real `<title>`, `<meta>`, OG tags, JSON-LD, and a server-rendered HTML snapshot of the main content (title, description, image, body) into the `index.html` shell
4. Returns that enriched HTML to the bot
5. Regular users continue to get the normal SPA (no change in UX)

The function will handle these route patterns:
- `/` — homepage with featured products + blogs snippet
- `/item/:slug` — product name, price, description, image
- `/item-category/:slug` — category name + product list
- `/blog` — blog index
- `/:slug` — individual blog post (full content)

### Layer 3 — Wire bots to the edge function

Two options for routing crawler traffic to the prerender function — I'll ask which you prefer.

### Layer 4 — Sitemap + robots.txt

- Add a `sitemap-xml` edge function that generates a live XML sitemap from products, categories, and blogs in the database
- Update `public/robots.txt` to reference the sitemap URL
- Already have the `robots-txt` edge function — add `Sitemap:` line

### Files that will change

- `index.html` — add `<!--app-head-->` and `<!--app-body-->` placeholders the prerender function will fill
- `src/main.tsx` — wrap App in `HelmetProvider`
- `src/pages/Index.tsx`, `BlogList.tsx`, `BlogPost.tsx`, `ProductPage.tsx`, `CategoryPage.tsx` — add `<Helmet>` with title, meta, canonical, OG, Twitter, JSON-LD
- `supabase/functions/prerender/index.ts` — new edge function (bot detection + DB fetch + HTML injection)
- `supabase/functions/sitemap-xml/index.ts` — new edge function (dynamic sitemap)
- `public/robots.txt` and `supabase/functions/robots-txt/index.ts` — add sitemap reference
- `package.json` — add `react-helmet-async`

### Why this works on Lovable

- No Next.js / SSR framework needed — Lovable only hosts static + edge functions, both of which we use
- Real users keep the fast SPA experience
- Bots get real HTML, real titles, real meta, real content — visible in "View Page Source" when fetched via the prerender route
- Social share cards finally work correctly

### Tradeoffs

- Prerender function adds a small DB read per bot request (cached for 5–10 min)
- Need to keep `<Helmet>` tags in sync when adding new SEO-relevant pages
- The "View Page Source" of a normal browser request will still show the SPA shell — only crawler User-Agents see the enriched HTML. To verify, you fetch with `curl -A "Googlebot" https://web.toolsmandu.com/item/some-slug`

## One decision needed before I implement

