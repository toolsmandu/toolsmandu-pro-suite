import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BOT_UA = /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|ia_archiver|sogou|petalbot|bytespider/i;

const SITE = "https://toolsmanducloud.com";

function escHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHead(p: { title: string; desc: string; url: string; image?: string; type?: string; jsonLd?: string }) {
  let h = `<title>${escHtml(p.title)}</title>\n`;
  h += `<meta name="description" content="${escHtml(p.desc)}">\n`;
  h += `<link rel="canonical" href="${escHtml(p.url)}">\n`;
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

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!--app-head-->
</head>
<body>
<div id="root"><!--app-body--></div>
</body>
</html>`;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  const ua = url.searchParams.get("ua") || req.headers.get("user-agent") || "";

  // Only serve to bots
  if (!BOT_UA.test(ua)) {
    return new Response("Not a bot", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  let headContent = "";
  let bodyContent = "";

  try {
    // Product page: /item/:slug
    const itemMatch = path.match(/^\/item\/([^/]+)\/?$/);
    if (itemMatch) {
      const slug = itemMatch[1];
      const { data: product } = await supabase
        .from("products")
        .select("name, slug, description, image_url, price, stock_status, meta_title, meta_description, product_variations(name, price)")
        .eq("slug", slug)
        .maybeSingle();

      if (product) {
        const title = product.meta_title || product.name;
        const desc = product.meta_description || product.description || "";
        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: desc,
          image: product.image_url,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "NPR",
            availability: product.stock_status === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        });
        headContent = buildHead({ title, desc, url: `${SITE}/item/${product.slug}`, image: product.image_url || undefined, type: "product", jsonLd });
        bodyContent = `<h1>${escHtml(product.name)}</h1>`;
        if (product.image_url) bodyContent += `<img src="${escHtml(product.image_url)}" alt="${escHtml(product.name)}">`;
        if (product.description) bodyContent += `<div>${product.description}</div>`;
        else if (desc) bodyContent += `<p>${escHtml(desc)}</p>`;
        bodyContent += `<p>Price: NPR ${product.price}</p>`;
      }
    }

    // Category page: /item-category/:slug
    const catMatch = path.match(/^\/item-category\/([^/]+)\/?$/);
    if (catMatch && !headContent) {
      const slug = catMatch[1];
      const { data: cat } = await supabase.from("categories").select("id, name, slug").eq("slug", slug).maybeSingle();
      if (cat) {
        const title = `${cat.name} — Toolsmandu`;
        const desc = `Browse ${cat.name} products at Toolsmandu. Premium digital software subscriptions at unbeatable prices.`;
        headContent = buildHead({ title, desc, url: `${SITE}/item-category/${cat.slug}` });
        bodyContent = `<h1>${escHtml(cat.name)}</h1><p>${escHtml(desc)}</p>`;
        const { data: catProducts } = await supabase
          .from("products")
          .select("name, slug, description, price")
          .eq("category_id", cat.id)
          .order("created_at", { ascending: false });
        if (catProducts?.length) {
          bodyContent += `<ul>${catProducts.map((cp) => `<li><a href="${SITE}/item/${cp.slug}">${escHtml(cp.name)}</a> — NPR ${cp.price}${cp.description ? `<p>${escHtml(cp.description)}</p>` : ""}</li>`).join("")}</ul>`;
        }
      }
    }

    // Blog list: /blog
    if (path === "/blog" && !headContent) {
      headContent = buildHead({
        title: "Blog — Toolsmandu",
        desc: "Tips, guides, and updates from Toolsmandu about premium digital software subscriptions.",
        url: `${SITE}/blog`,
      });
      const { data: blogs } = await supabase
        .from("blogs")
        .select("title, slug, excerpt")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(20);
      bodyContent = `<h1>Blog</h1>`;
      if (blogs) {
        bodyContent += `<ul>${blogs.map((b) => `<li><a href="${SITE}/${b.slug}">${escHtml(b.title)}</a>${b.excerpt ? ` — ${escHtml(b.excerpt)}` : ""}</li>`).join("")}</ul>`;
      }
    }

    // Blog post: /:slug (check if it's a published blog)
    if (!headContent && path !== "/" && !path.startsWith("/item") && !path.startsWith("/blog") && !path.startsWith("/admin") && !path.startsWith("/login") && !path.startsWith("/signup")) {
      const slug = path.replace(/^\//, "").replace(/\/$/, "");
      if (slug && !slug.includes("/")) {
        const { data: blog } = await supabase
          .from("blogs")
          .select("title, slug, excerpt, content, cover_image_url, meta_title, meta_description, meta_keywords, published_at, author_name")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();

        if (blog) {
          const title = blog.meta_title || blog.title;
          const desc = blog.meta_description || blog.excerpt || "";
          const jsonLd = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: desc,
            image: blog.cover_image_url,
            datePublished: blog.published_at,
            author: blog.author_name ? { "@type": "Person", name: blog.author_name } : undefined,
          });
          headContent = buildHead({ title, desc, url: `${SITE}/${blog.slug}`, image: blog.cover_image_url || undefined, type: "article", jsonLd });
          bodyContent = `<article><h1>${escHtml(blog.title)}</h1>${blog.content}</article>`;
        }
      }
    }

    // Homepage
    if (path === "/" && !headContent) {
      headContent = buildHead({
        title: "Toolsmandu — Premium Digital Software Subscriptions",
        desc: "Your trusted destination for premium digital software subscriptions at unbeatable prices. Instant delivery, 24/7 support.",
        url: SITE,
      });
      const { data: products } = await supabase
        .from("products")
        .select("name, slug, price, image_url")
        .order("created_at", { ascending: false })
        .limit(20);
      bodyContent = `<h1>Toolsmandu — Premium Digital Software Subscriptions</h1>`;
      if (products) {
        bodyContent += `<ul>${products.map((p) => `<li><a href="${SITE}/item/${p.slug}">${escHtml(p.name)}</a> — NPR ${p.price}</li>`).join("")}</ul>`;
      }
    }

    // Fallback
    if (!headContent) {
      headContent = buildHead({
        title: "Toolsmandu — Premium Digital Software Subscriptions",
        desc: "Your trusted destination for premium digital software subscriptions at unbeatable prices.",
        url: `${SITE}${path}`,
      });
    }
  } catch (e) {
    console.error("Prerender error:", e);
    headContent = buildHead({
      title: "Toolsmandu",
      desc: "Premium Digital Software Subscriptions",
      url: `${SITE}${path}`,
    });
  }

  const html = INDEX_HTML
    .replace("<!--app-head-->", headContent)
    .replace("<!--app-body-->", bodyContent);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=600",
    },
  });
});
