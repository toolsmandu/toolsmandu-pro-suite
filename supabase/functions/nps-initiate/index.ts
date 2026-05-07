import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const NPS_BASE = "https://api.nepalpayment.com";
const NPS_GATEWAY_URL = "https://gateway.nepalpayment.com/Payment/Index";

async function hmacSha512(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Build signature: concatenate values of fields sorted alphabetically by key
async function signPayload(fields: Record<string, string>, secret: string) {
  const keys = Object.keys(fields).sort((a, b) => a.localeCompare(b));
  const value = keys.map((k) => fields[k]).join("");
  return await hmacSha512(value, secret);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, return_url, website_url } = await req.json();
    if (!items?.length) {
      return new Response(JSON.stringify({ error: "No items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const total = items.reduce(
      (s: number, it: { price: number; quantity: number }) => s + it.price * it.quantity,
      0
    );

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Reuse pending order or create new
    const { data: existing } = await admin
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .in("payment_status", ["pending", "failed", "expired"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let order;
    if (existing) {
      const { data: updated, error } = await admin
        .from("orders")
        .update({
          total,
          payment_status: "pending",
          payment_method: "nps",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error || !updated) throw new Error("update failed");
      await admin.from("order_items").delete().eq("order_id", existing.id);
      order = updated;
    } else {
      const { data: created, error } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          total,
          status: "pending",
          payment_status: "pending",
          payment_method: "nps",
        })
        .select()
        .single();
      if (error || !created) throw new Error("create failed");
      order = created;
    }

    const orderItems = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.id,
      price: it.price,
      quantity: it.quantity,
      variation_id: it.variantId || null,
      variation_name: it.variantName || null,
      input_field_responses: it.inputFieldResponses || [],
    }));
    await admin.from("order_items").insert(orderItems);

    const merchantId = Deno.env.get("NPS_MERCHANT_ID")!;
    const merchantName = Deno.env.get("NPS_MERCHANT_NAME")!;
    const username = Deno.env.get("NPS_API_USERNAME")!;
    const password = Deno.env.get("NPS_API_PASSWORD")!;
    const secret = Deno.env.get("NPS_HMAC_SECRET_KEY")!;

    const merchantTxnId = `TM-${order.order_number || order.id.slice(0, 8)}-${Date.now()}`;
    const amountStr = total.toFixed(2);

    const sigFields = {
      Amount: amountStr,
      MerchantId: merchantId,
      MerchantName: merchantName,
      MerchantTxnId: merchantTxnId,
    };
    const signature = await signPayload(sigFields, secret);

    const basicAuth = btoa(`${username}:${password}`);

    const processRes = await fetch(`${NPS_BASE}/GetProcessId`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        MerchantId: merchantId,
        MerchantName: merchantName,
        Amount: amountStr,
        MerchantTxnId: merchantTxnId,
        Signature: signature,
      }),
    });

    const processData = await processRes.json();
    console.log("NPS GetProcessId response:", JSON.stringify(processData));

    if (!processRes.ok || processData.code !== "0" || !processData.data?.ProcessId) {
      await admin
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to initiate NPS payment", details: processData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processId = processData.data.ProcessId as string;

    await admin
      .from("orders")
      .update({
        nps_process_id: processId,
        nps_merchant_txn_id: merchantTxnId,
      })
      .eq("id", order.id);

    // Build redirect form fields. Signature for redirect is over the same fields used.
    const redirectFields: Record<string, string> = {
      MerchantId: merchantId,
      MerchantName: merchantName,
      Amount: amountStr,
      MerchantTxnId: merchantTxnId,
      ProcessId: processId,
      ResponseUrl: return_url || `${website_url}/payment/verify?gw=nps`,
      TransactionRemarks: `Toolsmandu Order ${order.order_number ?? order.id}`,
    };
    const redirectSignature = await signPayload(redirectFields, secret);

    return new Response(
      JSON.stringify({
        gateway_url: NPS_GATEWAY_URL,
        fields: { ...redirectFields, Signature: redirectSignature, InstrumentCode: "" },
        order_id: order.id,
        merchant_txn_id: merchantTxnId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("nps-initiate error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
