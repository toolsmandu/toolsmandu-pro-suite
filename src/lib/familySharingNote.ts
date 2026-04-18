import { supabase } from "@/integrations/supabase/client";

/**
 * After a family-sharing credential is assigned to an order, look up the
 * product's static order_note_template (if any) and insert it as a customer-
 * visible order note. Safely no-ops if no template is set or anything fails.
 *
 * Idempotent: if an identical note already exists on the order, it is skipped.
 */
export async function sendFamilySharingOrderNote(params: {
  credentialId: string;
  orderId: string;
  adminUserId: string;
}) {
  const { credentialId, orderId, adminUserId } = params;
  try {
    const { data: cred } = await supabase
      .from("family_sharing_credentials")
      .select("family_product_id")
      .eq("id", credentialId)
      .single();
    if (!cred?.family_product_id) return;

    const { data: fp } = await supabase
      .from("family_sharing_products")
      .select("order_note_template")
      .eq("id", cred.family_product_id)
      .single();
    const note = (fp as any)?.order_note_template?.trim();
    if (!note) return;

    // Avoid duplicating the same note on the same order
    const { data: existing } = await supabase
      .from("order_notes")
      .select("id")
      .eq("order_id", orderId)
      .eq("note", note)
      .limit(1);
    if (existing && existing.length > 0) return;

    await supabase.from("order_notes").insert({
      order_id: orderId,
      note,
      sent_by: adminUserId,
      is_admin_only: false,
    });
  } catch (e) {
    console.error("sendFamilySharingOrderNote failed", e);
  }
}
