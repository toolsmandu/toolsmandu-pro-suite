import { useState, useEffect } from "react";
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ArrowLeft, Trash2, Edit, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface Credential {
  id: string;
  username: string;
  password: string;
  remarks: string | null;
  expiry_date: string | null;
  max_limit: number;
  assigned_count: number;
  twofa_link: string | null;
  created_at: string;
  index_number: number;
  updated_at: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  expiry_days: number | null;
}

const emptyForm = { username: "", password: "", remarks: "", expiry_date: "", max_limit: "1", twofa_link: "", index_number: "" };

const AdminFamilySharingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [credentialVariantLinks, setCredentialVariantLinks] = useState<Record<string, { variant_id: string; priority: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const { data: fp } = await supabase
      .from("family_sharing_products")
      .select("id, product_id, products(name)")
      .eq("id", id)
      .single();
    if (fp) {
      setProductName((fp as any).products?.name || "Unknown");
      setProductId(fp.product_id);

      const { data: vars } = await supabase
        .from("product_variations")
        .select("id, name, price, expiry_days")
        .eq("product_id", fp.product_id)
        .eq("is_active", true)
        .order("sort_order");
      if (vars) setVariants(vars);
    }

    const { data: creds } = await supabase
      .from("family_sharing_credentials")
      .select("*")
      .eq("family_product_id", id)
      .order("index_number", { ascending: false });
    if (creds) setCredentials(creds as Credential[]);

    const { data: links } = await supabase
      .from("credential_variant_links")
      .select("credential_id, variant_id, priority");

    if (links) {
      const linkMap: Record<string, { variant_id: string; priority: string }[]> = {};
      links.forEach((l: any) => {
        if (!linkMap[l.credential_id]) linkMap[l.credential_id] = [];
        linkMap[l.credential_id].push({ variant_id: l.variant_id, priority: l.priority || 'primary' });
      });
      setCredentialVariantLinks(linkMap);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const openAdd = () => {
    setEditingId(null);
    const maxIndex = credentials.length > 0 ? Math.max(...credentials.map(c => c.index_number)) : 0;
    setForm({ ...emptyForm, index_number: String(maxIndex + 1) });
    setDialogOpen(true);
  };

  const openEdit = (c: Credential) => {
    setEditingId(c.id);
    setForm({
      username: c.username, password: c.password, remarks: c.remarks || "",
      expiry_date: c.expiry_date || "", max_limit: String(c.max_limit), twofa_link: c.twofa_link || "",
      index_number: String(c.index_number),
    });
    setDialogOpen(true);
  };

  const openVariantDialog = (credId: string) => {
    setSelectedCredentialId(credId);
    const links = credentialVariantLinks[credId] || [];
    const map: Record<string, string> = {};
    links.forEach(l => { map[l.variant_id] = l.priority; });
    setSelectedVariantMap(map);
    setVariantDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.password) { toast.error("Username and password are required"); return; }
    const payload = {
      family_product_id: id!,
      username: form.username, password: form.password,
      remarks: form.remarks || null, expiry_date: form.expiry_date || null,
      max_limit: parseInt(form.max_limit) || 1, twofa_link: form.twofa_link || null,
      index_number: parseInt(form.index_number) || 1,
    };

    if (editingId) {
      const { error } = await supabase.from("family_sharing_credentials").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Credential updated");
    } else {
      const { error } = await supabase.from("family_sharing_credentials").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Credential added");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (credId: string) => {
    const { error } = await supabase.from("family_sharing_credentials").delete().eq("id", credId);
    if (error) { toast.error(error.message); return; }
    toast.success("Credential deleted");
    fetchData();
  };

  const handleSaveVariantLinks = async () => {
    if (!selectedCredentialId) return;
    // Remove existing links for this credential
    await supabase.from("credential_variant_links").delete().eq("credential_id", selectedCredentialId);
    const entries = Object.entries(selectedVariantMap);
    if (entries.length > 0) {
      // For each variant+priority, remove any OTHER credential that holds the same slot
      for (const [vid, priority] of entries) {
        await supabase.from("credential_variant_links")
          .delete()
          .eq("variant_id", vid)
          .eq("priority", priority)
          .neq("credential_id", selectedCredentialId);
      }
      const inserts = entries.map(([vid, priority]) => ({
        credential_id: selectedCredentialId, variant_id: vid, priority,
      }));
      const { error } = await supabase.from("credential_variant_links").insert(inserts);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Variant assignments updated");
    setVariantDialogOpen(false);
    fetchData();
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariantMap(prev => {
      const next = { ...prev };
      if (next[variantId]) delete next[variantId];
      else next[variantId] = 'primary';
      return next;
    });
  };

  const getLinkedVariantNames = (credId: string) => {
    const links = credentialVariantLinks[credId] || [];
    return links.map(l => {
      const name = variants.find(v => v.id === l.variant_id)?.name;
      const tag = l.priority === 'primary' ? 'P' : 'S';
      return name ? `${name} (${tag})` : null;
    }).filter(Boolean);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/family-sharing")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">{productName} — Credentials</h2>
      </div>

      <Button onClick={openAdd} className="gap-2">
        <Plus className="h-4 w-4" /> Add Credential
      </Button>

      <Table>
        <TableHeader>
           <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Linked Variants</TableHead>
            <TableHead>Limit</TableHead>
             <TableHead>Assigned</TableHead>
             <TableHead>Last Updated</TableHead>
             <TableHead className="text-right">Actions</TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {credentials.map((c, idx) => {
            const linkedNames = getLinkedVariantNames(c.id);
            return (
              <TableRow key={c.id}>
                <TableCell>{c.index_number}</TableCell>
                <TableCell className="font-medium">{c.username}</TableCell>
                <TableCell>{c.password}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {linkedNames.length > 0 ? linkedNames.map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{name}</Badge>
                    )) : <span className="text-muted-foreground text-xs">None</span>}
                  </div>
                </TableCell>
                <TableCell>{c.max_limit}</TableCell>
                 <TableCell>{c.assigned_count}</TableCell>
                 <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.updated_at)}</TableCell>
                 <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Assign Variants" onClick={() => openVariantDialog(c.id)}>
                      <Link2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/family-sharing/${id}/credential/${c.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {credentials.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No credentials added yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Credential Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Credential" : "Add Credential"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Username *</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label>Password *</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>2FA Link</Label><Input value={form.twofa_link} onChange={(e) => setForm({ ...form, twofa_link: e.target.value })} /></div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
              <div><Label>Limit (max assignments)</Label><Input type="number" min="1" value={form.max_limit} onChange={(e) => setForm({ ...form, max_limit: e.target.value })} /></div>
            </div>
            {editingId && (
              <div><Label>Index Number</Label><Input type="number" min="1" value={form.index_number} onChange={(e) => setForm({ ...form, index_number: e.target.value })} /></div>
            )}
            <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Assignment Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Variants</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {variants.length === 0 ? (
              <p className="text-muted-foreground text-sm">No variants found for this product.</p>
            ) : (
              <div className="space-y-3">
                {variants.map((v) => {
                  const isSelected = !!selectedVariantMap[v.id];
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleVariant(v.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <div className="flex-1">
                        <p className="text-foreground font-medium text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          NPR {Number(v.price).toLocaleString()}
                          {v.expiry_days ? ` · ${v.expiry_days} days` : ""}
                        </p>
                      </div>
                      {isSelected && (
                        <Select value={selectedVariantMap[v.id]} onValueChange={(val) => setSelectedVariantMap(prev => ({ ...prev, [v.id]: val }))}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Button onClick={handleSaveVariantLinks} className="w-full">Save Assignments</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFamilySharingDetail;
