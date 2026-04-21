import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const userId = user.id;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles, error: roleError } = await serviceClient.from("user_roles").select("role").eq("user_id", userId);
    if (roleError) return jsonResponse({ error: "Could not verify admin access", details: roleError.message }, 500);
    const isAdminOrEditor = roles?.some((r: any) => ["admin", "editor"].includes(r.role));
    if (!isAdminOrEditor) return jsonResponse({ error: "Forbidden" }, 403);

    const zoneId = Deno.env.get("CLOUDFLARE_ZONE_ID");
    const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!zoneId || !cfToken) return jsonResponse({ error: "Cloudflare credentials not configured" }, 500);

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    });

    const cfText = await cfRes.text();
    let cfData: any = null;
    try {
      cfData = cfText ? JSON.parse(cfText) : null;
    } catch {
      return jsonResponse({ error: "Cloudflare returned an invalid response", status: cfRes.status, details: cfText.slice(0, 500) }, 502);
    }

    if (!cfRes.ok || !cfData?.success) return jsonResponse({ error: "Cache purge failed", status: cfRes.status, details: cfData?.errors || cfData }, 502);

    return jsonResponse({ success: true, message: "Cache purged successfully" });
  } catch (e: any) {
    return jsonResponse({ error: e.message || "Unexpected cache purge error" }, 500);
  }
});
