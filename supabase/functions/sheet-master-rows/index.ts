import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encKey = Deno.env.get("SHEET_MASTER_ENCRYPTION_KEY");
    if (!encKey) {
      return new Response(JSON.stringify({ error: "Encryption key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Role check
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles || []).some((r: any) => r.role === "admin" || r.role === "editor");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === "list") {
      const { sheet_id } = body;
      const { data, error } = await admin.rpc("list_sheet_master_rows", {
        _sheet_id: sheet_id,
        _encryption_key: encKey,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ rows: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upsert") {
      const { sheet_id, group_index, row_index, account, password, expiry_date, remarks } = body;
      const { data, error } = await admin.rpc("upsert_sheet_master_row", {
        _sheet_id: sheet_id,
        _group_index: group_index,
        _row_index: row_index,
        _account: account ?? null,
        _password: password ?? null,
        _expiry_date: expiry_date || null,
        _remarks: remarks ?? null,
        _encryption_key: encKey,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ id: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_group") {
      const { sheet_id, group_index } = body;
      const { error } = await admin.rpc("delete_sheet_master_group", {
        _sheet_id: sheet_id,
        _group_index: group_index,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
