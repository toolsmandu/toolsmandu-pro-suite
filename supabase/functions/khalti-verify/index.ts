import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pidx } = await req.json();
    if (!pidx) {
      return new Response(JSON.stringify({ error: "Missing pidx" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the order by pidx
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("payment_pidx", pidx)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already verified
    if (order.payment_status === "completed") {
      return new Response(
        JSON.stringify({ status: "completed", order_id: order.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const lookupRes = await fetch(`${khaltiBaseUrl}/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${khaltiSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const lookupData = await lookupRes.json();
    console.log("Khalti lookup:", JSON.stringify(lookupData));

    if (lookupData.status === "Completed") {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "completed", status: "processing" })
        .eq("id", order.id);

      // Send "Order Received" email (fire-and-forget)
      try {
        // Fetch order details for the email
        const [{ data: items }, { data: profile }, { data: logoSetting }] = await Promise.all([
          supabaseAdmin
            .from("order_items")
            .select("variation_name, products(name)")
            .eq("order_id", order.id),
          supabaseAdmin
            .from("profiles")
            .select("email, phone")
            .eq("user_id", order.user_id)
            .maybeSingle(),
          supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "email_logo_url")
            .maybeSingle(),
        ]);

        const productName = (items || [])
          .map((it: any) => `${it.products?.name || 'Item'}${it.variation_name ? ` - ${it.variation_name}` : ''}`)
          .join(', ');

        if (profile?.email) {
          await supabaseAdmin.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'new-order',
              recipientEmail: profile.email,
              idempotencyKey: `new-order-${order.id}`,
              templateData: {
                customerEmail: profile.email,
                customerPhone: profile.phone || '',
                productName,
                paymentMethod: 'Khalti',
                orderId: order.order_number,
                amount: String(order.total),
                logoUrl: logoSetting?.value || '',
              },
            },
          });
        }
      } catch (emailErr) {
        console.error("Failed to send new-order email:", emailErr);
      }

      return new Response(
        JSON.stringify({ status: "completed", order_id: order.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const failedStatus =
        lookupData.status === "Expired" ? "expired" : "failed";

      // Keep order as pending so customer can retry payment
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: failedStatus })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({
          status: failedStatus,
          order_id: order.id,
          khalti_status: lookupData.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
