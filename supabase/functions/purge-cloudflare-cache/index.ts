import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (error || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = data.claims.sub as string;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await serviceClient.from("user_roles").select("role").eq("user_id", userId);
    const isAdminOrEditor = roles?.some((r: any) => ["admin", "editor"].includes(r.role));
    if (!isAdminOrEditor) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const zoneId = Deno.env.get("CLOUDFLARE_ZONE_ID");
    const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!zoneId || !cfToken) {
      return new Response(JSON.stringify({ error: "Cloudflare credentials not configured" }), { status: 500, headers: corsHeaders });
    }

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    });

    const cfData = await cfRes.json();

    if (!cfData.success) {
      return new Response(JSON.stringify({ error: "Cache purge failed", details: cfData.errors }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, message: "Cache purged successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
