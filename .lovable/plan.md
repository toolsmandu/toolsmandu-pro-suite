

## Build-Time Static Generation for SEO

Generate static HTML files for every product, category, and blog post during the build step. Crawlers and social media bots will receive fully rendered HTML without needing the prerender edge function or Cloudflare Worker.

### How it works

1. After `vite build` produces the SPA in `dist/`, a post-build script runs
2. The script connects to the database, fetches all products, categories, and published blogs
3. For each route, it generates a standalone HTML file with real `<title>`, meta tags, OG tags, JSON-LD, and visible body content
4. The SPA's JS bundle is still included so normal users get the full React app after hydration
5. Crawlers see real content immediately in the raw HTML

```text
dist/
├── index.html                          ← homepage (enriched)
├── item/
│   ├── canva-pro/index.html           ← product page
│   ├── netflix-premium/index.html
│   └── ...
├── item-category/
│   ├── streaming/index.html           ← category page
│   └── ...
├── blog/
│   └── index.html                     ← blog listing
├── some-blog-slug/
│   └── index.html                     ← blog post
└── sitemap.xml                        ← generated sitemap
```

### Implementation steps

**Step 1 — Create `scripts/generate-static-pages.ts`**

A Node/TypeScript script that:
- Uses `@supabase/supabase-js` to fetch all products, categories, and published blogs from the database
- Reads the built `dist/index.html` as a template
- For each route, injects the appropriate `<title>`, `<meta>`, OG tags, JSON-LD schema, and a visible HTML body snapshot (h1, description, image, product list)
- Writes enriched HTML files to the correct paths under `dist/`
- Generates `dist/sitemap.xml` with all URLs

**Step 2 — Update `package.json` build script**

Change `"build"` from `"vite build"` to `"vite build && node scripts/generate-static-pages.ts"` so static pages are generated automatically on every deploy.

**Step 3 — Add `tsx` as a dev dependency**

The script uses TypeScript so we need `tsx` (or `ts-node`) to run it. Add as a devDependency.

**Step 4 — Update `index.html` with placeholders**

Add `<!--app-head-->` and `<!--app-body-->` comment markers that the script will replace with real content. The existing static meta tags stay as fallbacks.

**Step 5 — Keep existing `<Helmet>` tags**

The `react-helmet-async` tags already in `ProductPage.tsx`, `BlogPost.tsx`, etc. remain untouched. They handle client-side meta updates for users navigating within the SPA. The static HTML handles the initial page load for crawlers.

### What the generated HTML looks like (product example)

```html
<!doctype html>
<html lang="en">
<head>
  <title>Canva Pro — Toolsmandu</title>
  <meta name="description" content="Premium Canva Pro subscription...">
  <link rel="canonical" href="https://web.toolsmandu.com/item/canva-pro">
  <meta property="og:title" content="Canva Pro — Toolsmandu">
  <meta property="og:image" content="https://...image.jpg">
  <script type="application/ld+json">{"@type":"Product",...}</script>
  <script type="module" src="/assets/index-xxxxx.js"></script>
</head>
<body>
  <div id="root">
    <h1>Canva Pro</h1>
    <p>Premium Canva Pro subscription...</p>
    <img src="..." alt="Canva Pro">
  </div>
</body>
</html>
```

React hydrates over the static content when JS loads for real users.

### Files changed

- `scripts/generate-static-pages.ts` — new build script (the core of this feature)
- `package.json` — update build script, add `tsx` devDependency
- `index.html` — add `<!--app-head-->` and `<!--app-body-->` placeholders

### Tradeoffs

- Pages are only as fresh as the last deploy. If you add a product, you need to redeploy for it to appear in static HTML. (The SPA still shows it immediately for real users.)
- Build time increases slightly (a few seconds for DB queries + file writes)
- The prerender edge function and Cloudflare Worker become unnecessary and can be removed later

