import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://web.toolsmandu.com";

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const urls: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [];

    // Homepage
    urls.push({ loc: SITE, priority: "1.0", changefreq: "daily" });

    // Blog index
    urls.push({ loc: `${SITE}/blog`, priority: "0.8", changefreq: "daily" });

    // Products
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .order("created_at", { ascending: false });
    if (products) {
      for (const p of products) {
        urls.push({ loc: `${SITE}/item/${p.slug}`, lastmod: p.updated_at?.split("T")[0], priority: "0.8", changefreq: "weekly" });
      }
    }

    // Categories
    const { data: categories } = await supabase.from("categories").select("slug");
    if (categories) {
      for (const c of categories) {
        urls.push({ loc: `${SITE}/item-category/${c.slug}`, priority: "0.7", changefreq: "weekly" });
      }
    }

    // Blogs
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    if (blogs) {
      for (const b of blogs) {
        urls.push({ loc: `${SITE}/${b.slug}`, lastmod: b.updated_at?.split("T")[0], priority: "0.7", changefreq: "weekly" });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }
});
