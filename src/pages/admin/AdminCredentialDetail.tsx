import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatDate";
import { useAuth } from "@/contexts/AuthContext";
import { sendFamilySharingOrderNote } from "@/lib/familySharingNote";

interface CredentialData {
  id: string;
  username: string;
  password: string;
  remarks: string | null;
  expiry_date: string | null;
  max_limit: number;
  assigned_count: number;
  twofa_link: string | null;
  index_number: number;
  family_product_id: string;
}

interface AssignedCustomer {
  id: string;
  order_id: string;
  user_id: string;
  assigned_at: string;
  validity_days: number | null;
  order_number?: string;
  user_email?: string;
  user_phone?: string;
  product_name?: string;
  variation_name?: string;
  expiry_date?: string;
  remaining_days?: number;
}

const AdminCredentialDetail = () => {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credential, setCredential] = useState<CredentialData | null>(null);
  const [customers, setCustomers] = useState<AssignedCustomer[]>([]);
  const [editedExpiry, setEditedExpiry] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useInbuiltOtp, setUseInbuiltOtp] = useState(true);
  const [giveOtpAccess, setGiveOtpAccess] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    remarks: "",
    expiry_date: "",
    max_limit: "1",
    twofa_link: "",
    index_number: "1",
  });

  const fetchData = async () => {
    setLoading(true);

    // Fetch credential
    const { data: cred } = await supabase
      .from("family_sharing_credentials")
      .select("*")
      .eq("id", credentialId)
      .single();

    if (cred) {
      setCredential(cred as CredentialData);
      setForm({
        username: cred.username,
        password: cred.password,
        remarks: cred.remarks || "",
        expiry_date: cred.expiry_date || "",
        max_limit: String(cred.max_limit),
        twofa_link: cred.twofa_link || "",
        index_number: String(cred.index_number),
      });
      setUseInbuiltOtp(!cred.twofa_link);
      setGiveOtpAccess((cred as any).give_otp_access ?? true);
    }

    // Fetch assigned customers
    const { data: assignments } = await supabase
      .from("credential_assignments")
      .select("*")
      .eq("credential_id", credentialId)
      .order("assigned_at", { ascending: false });

    if (assignments && assignments.length > 0) {
      // Fetch order details and user profiles
      const orderIds = [...new Set(assignments.map(a => a.order_id))];
      const userIds = [...new Set(assignments.map(a => a.user_id))];

      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, order_number").in("id", orderIds),
        supabase.from("profiles").select("user_id, email, phone").in("user_id", userIds),
      ]);

      // Fetch order items for product + variation names
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, variation_name, products(name)")
        .in("order_id", orderIds);

      const orderMap: Record<string, string> = {};
      ordersRes.data?.forEach(o => { orderMap[o.id] = o.order_number; });

      const profileMap: Record<string, { email: string | null; phone: string | null }> = {};
      profilesRes.data?.forEach(p => { profileMap[p.user_id] = { email: p.email, phone: p.phone }; });

      const itemMap: Record<string, { product_name?: string; variation_name?: string }> = {};
      orderItems?.forEach((i: any) => {
        itemMap[i.order_id] = {
          product_name: i.products?.name || undefined,
          variation_name: i.variation_name || undefined,
        };
      });

      const enriched: AssignedCustomer[] = assignments.map(a => {
        const assignedDate = new Date(a.assigned_at);
        let expiryDate: string | undefined;
        let remainingDays: number | undefined;

        if (a.validity_days) {
          const expiry = new Date(assignedDate);
          expiry.setDate(expiry.getDate() + a.validity_days);
          expiryDate = expiry.toISOString().split("T")[0];
          remainingDays = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }

        return {
          ...a,
          order_number: orderMap[a.order_id],
          user_email: profileMap[a.user_id]?.email || undefined,
          user_phone: profileMap[a.user_id]?.phone || undefined,
          product_name: itemMap[a.order_id]?.product_name,
          variation_name: itemMap[a.order_id]?.variation_name,
          expiry_date: expiryDate,
          remaining_days: remainingDays,
        };
      });

      enriched.sort((a, b) => (a.remaining_days ?? Infinity) - (b.remaining_days ?? Infinity));
      setCustomers(enriched);
    } else {
      setCustomers([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [credentialId]);

  const handleSave = async () => {
    if (!form.username || !form.password) {
      toast.error("Username and password are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("family_sharing_credentials")
      .update({
        username: form.username,
        password: form.password,
        remarks: form.remarks || null,
        expiry_date: form.expiry_date || null,
        max_limit: parseInt(form.max_limit) || 1,
        twofa_link: useInbuiltOtp ? null : (form.twofa_link || null),
        index_number: parseInt(form.index_number) || 1,
      } as any)
      .eq("id", credentialId);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Credential updated");
    fetchData();
  };

  const handleDeleteAssignment = async (assignmentId: string, assignCredentialId: string) => {
    const { error: delError } = await supabase
      .from("credential_assignments")
      .delete()
      .eq("id", assignmentId);
    if (delError) { toast.error(delError.message); return; }

    // Decrement assigned_count
    if (credential) {
      await supabase
        .from("family_sharing_credentials")
        .update({ assigned_count: Math.max(0, credential.assigned_count - 1) })
        .eq("id", assignCredentialId);
    }

    toast.success("Assignment removed");
    fetchData();
  };

  const handleUpdateExpiry = async (assignmentId: string, assignedAt: string, newExpiryDate: string) => {
    // Calculate new validity_days from assigned_at to new expiry date
    const assignedMs = new Date(assignedAt).getTime();
    const expiryMs = new Date(newExpiryDate).getTime();
    const newValidityDays = Math.max(1, Math.ceil((expiryMs - assignedMs) / (1000 * 60 * 60 * 24)));

    const { error } = await supabase
      .from("credential_assignments")
      .update({ validity_days: newValidityDays })
      .eq("id", assignmentId);

    if (error) { toast.error(error.message); return; }
    toast.success("Expiry date updated");
    fetchData();
  };

  // Manual assignment state
  const [addingManual, setAddingManual] = useState(false);
  const [manualOrderNumber, setManualOrderNumber] = useState("");
  const [manualExpiryDate, setManualExpiryDate] = useState("");
  const [manualRemainingDays, setManualRemainingDays] = useState("");
  const [assigningManual, setAssigningManual] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    orderId: string; userId: string; productName: string; variationName: string; purchaseDate: string; variationExpiryDays: number | null;
  } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const handleLookupOrder = async () => {
    if (!manualOrderNumber.trim() || !credential) return;
    setLookingUp(true);
    setLookupResult(null);
    setLookupError("");
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, created_at")
        .eq("order_number", manualOrderNumber.trim())
        .single();
      if (!order) throw new Error("Order not found");

      const { data: fsp } = await supabase
        .from("family_sharing_products")
        .select("product_id")
        .eq("id", credential.family_product_id)
        .single();
      if (!fsp) throw new Error("Family sharing product not found");

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, variation_id, variation_name, products(name)")
        .eq("order_id", order.id)
        .eq("product_id", fsp.product_id);
      if (!orderItems?.length) throw new Error("Order does not contain the matching product");

      const { data: existing } = await supabase
        .from("credential_assignments")
        .select("id")
        .eq("order_id", order.id);
      if (existing && existing.length > 0) throw new Error("Order already assigned to a credential");

      let variationExpiryDays: number | null = null;
      const varId = orderItems[0]?.variation_id;
      if (varId) {
        const { data: variation } = await supabase
          .from("product_variations")
          .select("expiry_days")
          .eq("id", varId)
          .single();
        variationExpiryDays = variation?.expiry_days || null;
      }

      const item: any = orderItems[0];
      setLookupResult({
        orderId: order.id,
        userId: order.user_id,
        productName: item.products?.name || "Unknown",
        variationName: item.variation_name || "",
        purchaseDate: order.created_at,
        variationExpiryDays,
      });
    } catch (e: any) {
      setLookupError(e.message);
    } finally {
      setLookingUp(false);
    }
  };

  // When expiry date changes, recalculate remaining days
  useEffect(() => {
    if (manualExpiryDate) {
      const days = Math.max(0, Math.ceil((new Date(manualExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      setManualRemainingDays(String(days));
    } else {
      setManualRemainingDays("");
    }
  }, [manualExpiryDate]);

  // When remaining days changes manually, recalculate expiry date
  const handleRemainingDaysChange = (val: string) => {
    setManualRemainingDays(val);
    const days = parseInt(val);
    if (!isNaN(days) && days >= 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      setManualExpiryDate(expiry.toISOString().split("T")[0]);
    }
  };

  const handleManualAssign = async () => {
    if (!lookupResult || !credential) return;
    setAssigningManual(true);
    try {
      if (credential.assigned_count >= credential.max_limit) throw new Error("Credential has reached max assignment limit");

      let validityDays: number | null = null;
      if (manualExpiryDate) {
        validityDays = Math.max(1, Math.ceil((new Date(manualExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      } else {
        validityDays = lookupResult.variationExpiryDays;
      }

      await supabase.from("credential_assignments").insert({
        credential_id: credential.id,
        order_id: lookupResult.orderId,
        user_id: lookupResult.userId,
        validity_days: validityDays,
      });

      await supabase
        .from("family_sharing_credentials")
        .update({ assigned_count: credential.assigned_count + 1 })
        .eq("id", credential.id);

      if (user) {
        await sendFamilySharingOrderNote({
          credentialId: credential.id,
          orderId: lookupResult.orderId,
          adminUserId: user.id,
        });
      }

      toast.success("Order assigned successfully");
      setAddingManual(false);
      setManualOrderNumber("");
      setManualExpiryDate("");
      setManualRemainingDays("");
      setLookupResult(null);
      setLookupError("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAssigningManual(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!credential) {
    return <div className="text-center py-12 text-muted-foreground">Credential not found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">Edit Credential #{credential.index_number}</h2>
      </div>

      {/* Credential Edit Form */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Credential Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Username *</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
          <div><Label>Password *</Label><Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-inbuilt-otp"
                checked={useInbuiltOtp}
                onCheckedChange={(checked) => {
                  const v = !!checked;
                  setUseInbuiltOtp(v);
                  if (v) setForm(f => ({ ...f, twofa_link: "" }));
                }}
              />
              <Label htmlFor="use-inbuilt-otp" className="cursor-pointer">Use Inbuilt OTP Inbox</Label>
            </div>
            {!useInbuiltOtp && (
              <div>
                <Label>2FA Link (custom URL)</Label>
                <Input value={form.twofa_link} onChange={e => setForm({ ...form, twofa_link: e.target.value })} placeholder="https://..." />
              </div>
            )}
          </div>
          <div><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
          <div><Label>Limit (max assignments)</Label><Input type="number" min="1" value={form.max_limit} onChange={e => setForm({ ...form, max_limit: e.target.value })} /></div>
          <div><Label>Index Number</Label><Input type="number" min="1" value={form.index_number} onChange={e => setForm({ ...form, index_number: e.target.value })} /></div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Customers Table */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">CUSTOMERS</h3>
          <Button size="sm" onClick={() => setAddingManual(!addingManual)} variant={addingManual ? "secondary" : "default"}>
            <Plus className="h-4 w-4 mr-1" /> Assign Order
          </Button>
        </div>
        {addingManual && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <Label>Order Number</Label>
                <Input
                  placeholder="e.g. TM25 or 38"
                  value={manualOrderNumber}
                  onChange={e => { setManualOrderNumber(e.target.value); setLookupResult(null); setLookupError(""); }}
                />
              </div>
              <Button variant="outline" onClick={handleLookupOrder} disabled={lookingUp || !manualOrderNumber.trim()}>
                {lookingUp ? "Looking up..." : "Lookup"}
              </Button>
            </div>
            {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
            {lookupResult && (
              <div className="space-y-3">
                <div className="bg-background border border-border rounded-md p-3 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {[lookupResult.productName, lookupResult.variationName].filter(Boolean).join(' - ')}
                  </p>
                  <p className="text-xs text-muted-foreground">Purchase Date: {formatDate(lookupResult.purchaseDate)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Expiry Date (optional)</Label>
                    <Input
                      type="date"
                      value={manualExpiryDate}
                      onChange={e => setManualExpiryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Remaining Days</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={lookupResult.variationExpiryDays ? String(lookupResult.variationExpiryDays) : "—"}
                      value={manualRemainingDays}
                      onChange={e => handleRemainingDaysChange(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleManualAssign} disabled={assigningManual}>
                      {assigningManual ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Only orders with matching product can be assigned. Each order can only be assigned to one credential.
            </p>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Remaining Days</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(c => {
              const productLabel = [c.product_name, c.variation_name].filter(Boolean).join(' - ') || '—';
              return (
                <TableRow key={c.id}>
                  <TableCell>{c.order_number || "—"}</TableCell>
                  <TableCell className="font-medium">{c.user_email || "—"}</TableCell>
                  <TableCell>{c.user_phone || "—"}</TableCell>
                  <TableCell>{productLabel}</TableCell>
                  <TableCell>{formatDate(c.assigned_at)}</TableCell>
                  <TableCell>
                    {c.expiry_date ? (
                      <Input
                        type="date"
                        value={editedExpiry[c.id] ?? c.expiry_date}
                        className="w-36 h-8 text-xs"
                        onChange={(e) => setEditedExpiry(prev => ({ ...prev, [c.id]: e.target.value }))}
                      />
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {c.remaining_days !== undefined ? (
                      <Badge variant={c.remaining_days <= 7 ? "destructive" : "secondary"}>
                        {c.remaining_days} days
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {editedExpiry[c.id] && editedExpiry[c.id] !== c.expiry_date && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          handleUpdateExpiry(c.id, c.assigned_at, editedExpiry[c.id]);
                          setEditedExpiry(prev => { const n = { ...prev }; delete n[c.id]; return n; });
                        }}
                      >
                        Update
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteAssignment(c.id, credential.id)}
                    >
                      🗑
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No customers assigned to this credential yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCredentialDetail;
