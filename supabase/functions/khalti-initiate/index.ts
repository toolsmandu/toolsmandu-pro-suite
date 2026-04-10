import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, return_url, website_url } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    // Use service role to create orders
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create a single order for all items
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert order items
    const orderItems = items.map(
      (item: {
        id: string;
        price: number;
        quantity: number;
        variantId?: string;
        variantName?: string;
      }) => ({
        order_id: order.id,
        product_id: item.id,
        price: item.price,
        quantity: item.quantity,
        variation_id: item.variantId || null,
        variation_name: item.variantName || null,
      })
    );

    await supabaseAdmin.from("order_items").insert(orderItems);

    // Determine Khalti environment
    const { data: envSetting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "khalti_environment")
      .single();

    const isProduction = envSetting?.value === "production";
    const khaltiBaseUrl = isProduction
      ? "https://khalti.com/api/v2"
      : "https://a.khalti.com/api/v2";

    const khaltiSecretKey = Deno.env.get("KHALTI_SECRET_KEY")!;

    // Amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(total * 100);

    const khaltiPayload = {
      return_url: return_url || website_url + "/payment/verify",
      website_url: website_url,
      amount: amountInPaisa,
      purchase_order_id: order.id,
      purchase_order_name: `Toolsmandu Order ${order.order_number}`,
      customer_info: {
        name: user.user_metadata?.name || user.email,
        email: user.email,
      },
    };

    console.log("Initiating Khalti payment:", JSON.stringify(khaltiPayload));

    const khaltiRes = await fetch(
      `${khaltiBaseUrl}/epayment/initiate/`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(khaltiPayload),
      }
    );

    const khaltiData = await khaltiRes.json();
    console.log("Khalti response:", JSON.stringify(khaltiData));

    if (!khaltiRes.ok || !khaltiData.payment_url) {
      // Cancel the order if Khalti initiation fails
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({
          error: "Failed to initiate payment",
          details: khaltiData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Store pidx
    await supabaseAdmin
      .from("orders")
      .update({ payment_pidx: khaltiData.pidx })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        payment_url: khaltiData.payment_url,
        pidx: khaltiData.pidx,
        order_id: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
