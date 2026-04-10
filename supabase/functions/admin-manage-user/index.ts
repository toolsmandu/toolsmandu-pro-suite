import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin/editor
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", caller.id);
    const isAdminOrEditor = callerRoles?.some((r: any) => r.role === "admin" || r.role === "editor");
    if (!isAdminOrEditor) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const { action, user_id } = body;

    if (action === "update") {
      const { name, email, phone, password, is_suspended, email_confirmed } = body;

      // Update profile
      const profileUpdate: any = {};
      if (name !== undefined) profileUpdate.name = name;
      if (email !== undefined) profileUpdate.email = email;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (is_suspended !== undefined) profileUpdate.is_suspended = is_suspended;
      
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("user_id", user_id);
        if (profileError) return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders });
      }

      // Update auth user (email, password, email_confirm)
      const authUpdate: any = {};
      if (email !== undefined) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (email_confirmed) authUpdate.email_confirm = true;

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUser(user_id, authUpdate);
        if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "delete") {
      // Delete profile and auth user, but keep orders/tickets (they reference user_id, not cascaded from auth)
      // First delete from user_roles
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      // Delete profile
      await supabase.from("profiles").delete().eq("user_id", user_id);
      // Delete wishlist
      await supabase.from("wishlist").delete().eq("user_id", user_id);
      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
