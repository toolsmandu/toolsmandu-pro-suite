import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DEFAULT = `User-agent: *\nAllow: /\n`;

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "robots_txt")
      .maybeSingle();
    const body = data?.value && data.value.trim().length > 0 ? data.value : DEFAULT;
    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(DEFAULT, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
});
