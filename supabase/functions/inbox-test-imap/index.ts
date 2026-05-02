// Test IMAP connection (admin only) — verifies credentials by connecting
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ImapFlow } from "https://esm.sh/imapflow@1.0.150";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { server_id } = await req.json();
    if (!server_id) return json({ error: "server_id required" }, 400);

    const { data: creds, error: credErr } = await admin.rpc("get_imap_server_decrypted", {
      _id: server_id,
      _encryption_key: Deno.env.get("IMAP_ENCRYPTION_KEY")!,
    });
    if (credErr) throw credErr;
    if (!creds || creds.length === 0) return json({ error: "Server not found" }, 404);

    const c = creds[0];
    const client = new ImapFlow({
      host: c.host,
      port: c.port,
      secure: c.encryption === "ssl",
      auth: { user: c.username, pass: c.password },
      tls: { rejectUnauthorized: !!c.validate_cert },
      logger: false,
    });

    await client.connect();
    await client.logout();
    return json({ ok: true, message: "Connection successful" });
  } catch (e) {
    console.error("inbox-test-imap error", e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
