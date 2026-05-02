// Admin: save (create/update) IMAP server with encryption key from secret
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const body = await req.json();
    const { id, tag, host, port, encryption, username, password, validate_cert, is_active } = body;

    if (!tag || !host || !username) return json({ error: "tag, host, username required" }, 400);
    if (!id && !password) return json({ error: "password required for new server" }, 400);

    // Call RPC as service role with encryption key from secret
    // RPC checks admin via auth.uid(); since we're service role, we must impersonate the user.
    // Simpler: use a separate SECURITY DEFINER function that doesn't check role (we already verified above).
    // For now: directly insert/update via service role bypassing RLS, encrypting via SQL.
    const encKey = Deno.env.get("IMAP_ENCRYPTION_KEY")!;

    if (id) {
      // Update
      const updateFields: any = {
        tag, host, port, encryption, username,
        validate_cert, is_active, updated_at: new Date().toISOString(),
      };
      if (password) {
        // Use raw SQL via rpc to encrypt
        const { error: encErr } = await admin.rpc("update_imap_server_with_password", {
          _id: id, _tag: tag, _host: host, _port: port, _encryption: encryption,
          _username: username, _password: password, _validate_cert: validate_cert,
          _is_active: is_active, _encryption_key: encKey,
        });
        if (encErr) throw encErr;
      } else {
        const { error: updErr } = await admin.from("inbox_imap_servers").update(updateFields).eq("id", id);
        if (updErr) throw updErr;
      }
    } else {
      const { error: insErr } = await admin.rpc("insert_imap_server_with_password", {
        _tag: tag, _host: host, _port: port, _encryption: encryption,
        _username: username, _password: password, _validate_cert: validate_cert,
        _is_active: is_active, _encryption_key: encKey,
      });
      if (insErr) throw insErr;
    }

    return json({ ok: true });
  } catch (e) {
    console.error("inbox-save-server error", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
