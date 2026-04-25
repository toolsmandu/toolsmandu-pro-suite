import { createClient } from "npm:@supabase/supabase-js@2";

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
    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    const isEditor = callerRoles?.some((r: any) => r.role === "editor");
    const isAdminOrEditor = isAdmin || isEditor;
    if (!isAdminOrEditor) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const { action, user_id } = body;

    if (action === "create") {
      const { name, email, phone, password, role } = body;
      // Editors can only create customers; admins can create customer/editor/admin
      if (isEditor && role !== "customer") {
        return new Response(JSON.stringify({ error: "Editors can only create customer accounts" }), { status: 403, headers: corsHeaders });
      }
      if (!isAdmin && role === "admin") {
        return new Response(JSON.stringify({ error: "Only admins can create admin accounts" }), { status: 403, headers: corsHeaders });
      }

      // Create auth user — use provided password, fallback to email
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: password && password.length >= 6 ? password : email,
        email_confirm: true,
      });
      if (createError) return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: corsHeaders });

      const newUserId = newUser.user.id;

      // Update profile with name and phone (profile is auto-created by trigger)
      await supabase.from("profiles").update({ name, phone }).eq("user_id", newUserId);

      // If role is not customer, update the role (trigger creates 'customer' by default)
      if (role && role !== "customer") {
        await supabase.from("user_roles").update({ role }).eq("user_id", newUserId);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUserId }), { headers: corsHeaders });
    }

    if (action === "update") {
      const { name, email, phone, password, is_suspended, email_confirmed, role } = body;

      // Editors cannot modify admin accounts
      if (isEditor && !isAdmin) {
        const { data: targetRoles } = await supabase.from("user_roles").select("role").eq("user_id", user_id);
        if (targetRoles?.some((r: any) => r.role === "admin")) {
          return new Response(JSON.stringify({ error: "Editors cannot edit admin accounts" }), { status: 403, headers: corsHeaders });
        }
      }


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
        const { error: authError } = await supabase.auth.admin.updateUserById(user_id, authUpdate);
        if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
      }

      // Role update — admin only
      if (role !== undefined) {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Only admins can change user roles" }), { status: 403, headers: corsHeaders });
        }
        if (!["admin", "editor", "customer"].includes(role)) {
          return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: corsHeaders });
        }
        await supabase.from("user_roles").delete().eq("user_id", user_id);
        const { error: roleError } = await supabase.from("user_roles").insert({ user_id, role });
        if (roleError) return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "delete") {
      // Delete profile and auth user, but keep orders/tickets (they reference user_id, not cascaded from auth)
      // First delete from user_roles
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      // Delete profile
      await supabase.from("profiles").delete().eq("user_id", user_id);
      
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
