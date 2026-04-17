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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { email, phone } = body;

    if (typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const newEmail = email.trim().toLowerCase();

    // If email is changing, ensure it's not used by another auth user
    if (newEmail !== (caller.email || "").toLowerCase()) {
      // Check profiles table for conflicts
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("email", newEmail)
        .neq("user_id", caller.id)
        .maybeSingle();
      if (existingProfile) {
        return new Response(JSON.stringify({ error: "This email is already in use." }), { status: 409, headers: corsHeaders });
      }

      // Update auth email & confirm immediately so login works without verification
      const { error: authError } = await admin.auth.admin.updateUserById(caller.id, {
        email: newEmail,
        email_confirm: true,
      });
      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders });
      }
    }

    // Update profile (email + phone)
    const profileUpdate: Record<string, unknown> = { email: newEmail };
    if (phone !== undefined) profileUpdate.phone = phone;

    const { error: profileError } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", caller.id);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, email: newEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
