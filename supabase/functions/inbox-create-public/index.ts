// Create a disposable inbox for an anonymous (public) visitor, keyed by session_id
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { username, domain_id, session_id } = await req.json();
    if (!username || !domain_id || !session_id) {
      return json({ error: "username, domain_id, session_id required" }, 400);
    }

    const cleanUser = String(username).toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
    if (!cleanUser || cleanUser.length < 2) return json({ error: "Invalid username" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: dom, error: domErr } = await supabase
      .from("inbox_domains")
      .select("id, domain, is_active")
      .eq("id", domain_id)
      .maybeSingle();
    if (domErr) throw domErr;
    if (!dom || !dom.is_active) return json({ error: "Domain not available" }, 400);

    const email = `${cleanUser}@${dom.domain}`.toLowerCase();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await supabase
      .from("inbox_addresses")
      .select("id, email, expires_at, session_id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Allow only if same session
      if (existing.session_id !== session_id) {
        return json({ error: "Address already taken" }, 409);
      }
      return json({ inbox: existing });
    }

    const { data: inserted, error: insErr } = await supabase
      .from("inbox_addresses")
      .insert({ email, username: cleanUser, domain_id, session_id, expires_at: expires })
      .select()
      .single();
    if (insErr) throw insErr;

    return json({ inbox: inserted });
  } catch (e) {
    console.error("inbox-create-public error", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
