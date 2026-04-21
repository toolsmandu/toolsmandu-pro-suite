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

function setupError(error: string, details?: unknown) {
  return jsonResponse({ success: false, error, details });
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
    const cfEmail = Deno.env.get("CLOUDFLARE_AUTH_EMAIL");

    if (!zoneId || !cfToken) return setupError("Cloudflare credentials not configured");
    if (!/^[a-f0-9]{32}$/i.test(zoneId.trim())) {
      return setupError("Invalid Cloudflare Zone ID. Use the 32-character Zone ID from Cloudflare, not the domain name.");
    }

    const normalizedToken = cfToken.replace(/^Bearer\s+/i, "").trim();

    // Detect if this is a Global API Key (37-char hex) vs API Token
    const isGlobalKey = /^[a-f0-9]{37}$/i.test(normalizedToken);

    let cfHeaders: Record<string, string>;
    if (isGlobalKey) {
      if (!cfEmail) {
        return setupError(
          "Global API Key detected but CLOUDFLARE_AUTH_EMAIL secret is not set. Please add your Cloudflare account email as the CLOUDFLARE_AUTH_EMAIL secret."
        );
      }
      cfHeaders = {
        "X-Auth-Key": normalizedToken,
        "X-Auth-Email": cfEmail.trim(),
        "Content-Type": "application/json",
      };
    } else {
      cfHeaders = {
        Authorization: `Bearer ${normalizedToken}`,
        "Content-Type": "application/json",
      };
    }

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId.trim()}/purge_cache`, {
      method: "POST",
      headers: cfHeaders,
      body: JSON.stringify({ purge_everything: true }),
    });

    const cfText = await cfRes.text();
    let cfData: any = null;
    try {
      cfData = cfText ? JSON.parse(cfText) : null;
    } catch {
      return setupError("Cloudflare returned an invalid response", { status: cfRes.status, body: cfText.slice(0, 500) });
    }

    if (!cfRes.ok || !cfData?.success) {
      return setupError("Cache purge failed", {
        status: cfRes.status,
        errors: cfData?.errors || cfData,
        hint: "Ensure your CLOUDFLARE_API_TOKEN has 'Zone > Cache Purge > Purge' permission. If using a Global API Key, also set CLOUDFLARE_AUTH_EMAIL.",
      });
    }

    return jsonResponse({ success: true, message: "Cache purged successfully" });
  } catch (e: any) {
    return jsonResponse({ error: e.message || "Unexpected cache purge error" }, 500);
  }
});
