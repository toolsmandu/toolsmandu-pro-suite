import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const NPS_BASE = "https://api.nepalpayment.com";

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

async function signPayload(fields: Record<string, string>, secret: string) {
  const keys = Object.keys(fields).sort((a, b) => a.localeCompare(b));
  return hmacSha512(keys.map((k) => fields[k]).join(""), secret);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { merchant_txn_id } = await req.json();
    if (!merchant_txn_id) {
      return new Response(JSON.stringify({ error: "Missing merchant_txn_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("nps_merchant_txn_id", merchant_txn_id)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantId = Deno.env.get("NPS_MERCHANT_ID")!;
    const merchantName = Deno.env.get("NPS_MERCHANT_NAME")!;
    const username = Deno.env.get("NPS_API_USERNAME")!;
    const password = Deno.env.get("NPS_API_PASSWORD")!;
    const secret = Deno.env.get("NPS_HMAC_SECRET_KEY")!;

    const fields = {
      MerchantId: merchantId,
      MerchantName: merchantName,
      MerchantTxnId: merchant_txn_id,
    };
    const signature = await signPayload(fields, secret);

    const res = await fetch(`${NPS_BASE}/CheckTransactionStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
      body: JSON.stringify({ ...fields, Signature: signature }),
    });
    const data = await res.json();
    console.log("NPS CheckTransactionStatus:", JSON.stringify(data));

    const status = (data?.data?.Status || "").toLowerCase();
    const gatewayRef = data?.data?.GatewayReferenceNo || null;

    if (status === "success" || status === "successful" || status === "completed") {
      await admin
        .from("orders")
        .update({
          status: "completed",
          payment_status: "completed",
          nps_gateway_ref: gatewayRef,
        })
        .eq("id", order.id);
      return new Response(JSON.stringify({ status: "completed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "pending") {
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("orders")
      .update({ payment_status: "failed", nps_gateway_ref: gatewayRef })
      .eq("id", order.id);

    return new Response(JSON.stringify({ status: status || "failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nps-verify error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
