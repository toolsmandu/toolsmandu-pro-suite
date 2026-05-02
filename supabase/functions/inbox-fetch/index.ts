// Disposable inbox: fetch messages from IMAP catch-all for a given address
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ImapFlow } from "https://esm.sh/imapflow@1.0.150";
import { simpleParser } from "https://esm.sh/mailparser@3.6.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, limit = 30 } = await req.json();
    if (!email || typeof email !== "string") {
      return json({ error: "email required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encKey = Deno.env.get("IMAP_ENCRYPTION_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the address exists
    const { data: addr, error: addrErr } = await supabase
      .from("inbox_addresses")
      .select("id, email, domain_id, inbox_domains!inner(imap_server_id, is_active)")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (addrErr) throw addrErr;
    if (!addr) return json({ error: "Address not found" }, 404);

    const serverId = (addr as any).inbox_domains.imap_server_id;

    // Decrypt IMAP credentials
    const { data: creds, error: credErr } = await supabase.rpc(
      "get_imap_server_decrypted",
      { _id: serverId, _encryption_key: encKey }
    );
    if (credErr) throw credErr;
    if (!creds || creds.length === 0) return json({ error: "IMAP server not found" }, 500);

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
    const lock = await client.getMailboxLock("INBOX");
    const messages: any[] = [];

    try {
      const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const search = await client.search({ to: email, since });
      const uids = (search || []).slice(-limit).reverse();
      for (const uid of uids) {
        const msg = await client.fetchOne(uid, { source: true, envelope: true, internalDate: true });
        if (!msg) continue;
        const parsed = await simpleParser(msg.source as Uint8Array);
        messages.push({
          uid,
          subject: parsed.subject || "(no subject)",
          from: parsed.from?.text || "",
          date: parsed.date || msg.internalDate,
          text: parsed.text || "",
          html: parsed.html || null,
        });
      }
    } finally {
      lock.release();
      await client.logout();
    }

    return json({ messages });
  } catch (e) {
    console.error("inbox-fetch error", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
