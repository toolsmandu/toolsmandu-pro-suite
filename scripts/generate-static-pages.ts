import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SITE = "https://web.toolsmandu.com";
const DIST = path.resolve("dist");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Try reading from .env file
  const envPath = path.resolve(".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^(\w+)=["']?(.+?)["']?$/);
      if (match) process.env[match[1]] = match[2];
    }
  }
}

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

function escHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHead(p: { title: string; desc: string; url: string; image?: string; type?: string; jsonLd?: string; keywords?: string }) {
  let h = "";
  h += `<title>${escHtml(p.title)}</title>\n`;
  h += `<meta name="description" content="${escHtml(p.desc)}">\n`;
  h += `<link rel="canonical" href="${escHtml(p.url)}">\n`;
  if (p.keywords) h += `<meta name="keywords" content="${escHtml(p.keywords)}">\n`;
  h += `<meta property="og:type" content="${p.type || "website"}">\n`;
  h += `<meta property="og:title" content="${escHtml(p.title)}">\n`;
  h += `<meta property="og:description" content="${escHtml(p.desc)}">\n`;
  h += `<meta property="og:url" content="${escHtml(p.url)}">\n`;
  if (p.image) h += `<meta property="og:image" content="${escHtml(p.image)}">\n`;
  h += `<meta name="twitter:card" content="summary_large_image">\n`;
  h += `<meta name="twitter:title" content="${escHtml(p.title)}">\n`;
  h += `<meta name="twitter:description" content="${escHtml(p.desc)}">\n`;
  if (p.image) h += `<meta name="twitter:image" content="${escHtml(p.image)}">\n`;
  if (p.jsonLd) h += `<script type="application/ld+json">${p.jsonLd}</script>\n`;
  return h;
}

function writePage(relPath: string, template: string, headContent: string, bodyContent: string) {
  let html = template
    .replace(/<!--default-title--><title>[^<]*<\/title>\n?\s*/g, "")
    .replace(/<!--default-desc--><meta[^>]*>\n?\s*/g, "")
    .replace("<!--app-head-->", headContent)
    .replace("<!--app-body-->", bodyContent);
  const filePath = path.join(DIST, relPath, "index.html");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, "utf-8");
}

async function main() {
  const templatePath = path.join(DIST, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("dist/index.html not found. Run vite build first.");
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, "utf-8");

  const sitemapUrls: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [];
  sitemapUrls.push({ loc: SITE, priority: "1.0", changefreq: "daily" });
  sitemapUrls.push({ loc: `${SITE}/blog`, priority: "0.8", changefreq: "daily" });

  let count = 0;

  // ── Homepage ──
  const { data: homepageProducts } = await supabase
    .from("products")
    .select("name, slug, price, image_url")
    .order("created_at", { ascending: false })
    .limit(20);

  const homepageHead = buildHead({
    title: "Toolsmandu — Premium Digital Software Subscriptions",
    desc: "Your trusted destination for premium digital software subscriptions at unbeatable prices. Instant delivery, 24/7 support.",
    url: SITE,
  });
  let homepageBody = `<h1>Toolsmandu — Premium Digital Software Subscriptions</h1>`;
  if (homepageProducts?.length) {
    homepageBody += `<ul>${homepageProducts.map(p => `<li><a href="${SITE}/item/${p.slug}">${escHtml(p.name)}</a> — NPR ${p.price}</li>`).join("")}</ul>`;
  }
  // Overwrite the root index.html
  const homepageHtml = template.replace("<!--app-head-->", homepageHead).replace("<!--app-body-->", homepageBody);
  fs.writeFileSync(templatePath, homepageHtml, "utf-8");
  count++;

  // ── Products ──
  const { data: products } = await supabase
    .from("products")
    .select("name, slug, description, image_url, price, stock_status, meta_title, meta_description, updated_at")
    .order("created_at", { ascending: false });

  if (products) {
    for (const p of products) {
      const title = p.meta_title || p.name;
      const desc = p.meta_description || p.description || "";
      const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: desc,
        image: p.image_url,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "NPR",
          availability: p.stock_status === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      });
      const head = buildHead({ title: `${title} — Toolsmandu`, desc, url: `${SITE}/item/${p.slug}`, image: p.image_url || undefined, type: "product", jsonLd });
      let body = `<h1>${escHtml(p.name)}</h1><p>${escHtml(desc)}</p>`;
      if (p.image_url) body += `<img src="${escHtml(p.image_url)}" alt="${escHtml(p.name)}">`;
      writePage(`item/${p.slug}`, template, head, body);
      sitemapUrls.push({ loc: `${SITE}/item/${p.slug}`, lastmod: p.updated_at?.split("T")[0], priority: "0.8", changefreq: "weekly" });
      count++;
    }
  }

  // ── Categories ──
  const { data: categories } = await supabase.from("categories").select("name, slug").order("sort_order");
  if (categories) {
    for (const c of categories) {
      const title = `${c.name} — Toolsmandu`;
      const desc = `Browse ${c.name} products at Toolsmandu. Premium digital software subscriptions at unbeatable prices.`;
      const head = buildHead({ title, desc, url: `${SITE}/item-category/${c.slug}` });
      const body = `<h1>${escHtml(c.name)}</h1><p>${escHtml(desc)}</p>`;
      writePage(`item-category/${c.slug}`, template, head, body);
      sitemapUrls.push({ loc: `${SITE}/item-category/${c.slug}`, priority: "0.7", changefreq: "weekly" });
      count++;
    }
  }

  // ── Blog listing ──
  const { data: blogs } = await supabase
    .from("blogs")
    .select("title, slug, excerpt, content, cover_image_url, meta_title, meta_description, meta_keywords, published_at, author_name, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  {
    const head = buildHead({
      title: "Blog — Toolsmandu",
      desc: "Tips, guides, and updates from Toolsmandu about premium digital software subscriptions.",
      url: `${SITE}/blog`,
    });
    let body = `<h1>Blog</h1>`;
    if (blogs?.length) {
      body += `<ul>${blogs.map(b => `<li><a href="${SITE}/${b.slug}">${escHtml(b.title)}</a>${b.excerpt ? ` — ${escHtml(b.excerpt)}` : ""}</li>`).join("")}</ul>`;
    }
    writePage("blog", template, head, body);
    count++;
  }

  // ── Blog posts ──
  if (blogs) {
    for (const b of blogs) {
      const title = b.meta_title || b.title;
      const desc = b.meta_description || b.excerpt || "";
      const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: b.title,
        description: desc,
        image: b.cover_image_url,
        datePublished: b.published_at,
        author: b.author_name ? { "@type": "Person", name: b.author_name } : undefined,
      });
      const head = buildHead({
        title: `${title} — Toolsmandu`,
        desc,
        url: `${SITE}/${b.slug}`,
        image: b.cover_image_url || undefined,
        type: "article",
        jsonLd,
        keywords: b.meta_keywords || undefined,
      });
      const body = `<article><h1>${escHtml(b.title)}</h1>${b.content || ""}</article>`;
      writePage(b.slug, template, head, body);
      sitemapUrls.push({ loc: `${SITE}/${b.slug}`, lastmod: b.updated_at?.split("T")[0], priority: "0.7", changefreq: "weekly" });
      count++;
    }
  }

  // ── Sitemap ──
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");

  console.log(`✅ Generated ${count} static pages + sitemap.xml`);
}

main().catch((e) => {
  console.error("Static generation failed:", e);
  process.exit(1);
});
