// Called by DB triggers via pg_net. Auth = shared push key in header.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const incomingKey = req.headers.get("x-push-key");
    const pushKey = Deno.env.get("PROJECT_B_PUSH_KEY");
    if (!pushKey || incomingKey !== pushKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    // Expected: { type: 'product'|'variation'|'category', op: 'insert'|'update'|'delete', row: {...} }
    if (!body?.type || !body?.op || !body?.row) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectBUrl = Deno.env.get("PROJECT_B_SUPABASE_URL");
    if (!projectBUrl) {
      return new Response(JSON.stringify({ error: "PROJECT_B_SUPABASE_URL not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `${projectBUrl.replace(/\/$/, "")}/functions/v1/receive-from-a`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-push-key": pushKey },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    if (!resp.ok) {
      console.error(`Project B sync failed [${resp.status}]:`, text);
      return new Response(JSON.stringify({ error: `Project B error [${resp.status}]: ${text}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("push-product-to-b error:", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
