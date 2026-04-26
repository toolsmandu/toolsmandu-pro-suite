import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ArrowRight, Trash2, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FamilyProduct {
  id: string;
  product_id: string;
  login_link: string | null;
  created_at: string;
  products: { name: string } | null;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  expiry_days: number | null;
}

const OrderSearch = ({ navigate }: { navigate: (path: string) => void }) => {
  const [orderNumber, setOrderNumber] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    setSearching(true);
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber.trim())
        .single();
      if (!order) { toast.error("Order not found"); return; }

      const { data: assignment } = await supabase
        .from("credential_assignments")
        .select("credential_id")
        .eq("order_id", order.id)
        .single();
      if (!assignment) { toast.error("This order is not assigned to any credential"); return; }

      const { data: cred } = await supabase
        .from("family_sharing_credentials")
        .select("family_product_id")
        .eq("id", assignment.credential_id)
        .single();
      if (!cred) { toast.error("Credential not found"); return; }

      navigate(`/admin/family-sharing/${cred.family_product_id}/credential/${assignment.credential_id}`);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex items-end gap-2 max-w-md">
      <div className="flex-1">
        <Input
          placeholder="Search by Order ID..."
          value={orderNumber}
          onChange={e => setOrderNumber(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
      </div>
      <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleSearch} disabled={searching || !orderNumber.trim()}>
        <Search className="h-4 w-4 mr-1" /> {searching ? "Searching..." : "Search"}
      </Button>
    </div>
  );
};

const AdminFamilySharing = () => {
  const [familyProducts, setFamilyProducts] = useState<FamilyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loginLink, setLoginLink] = useState("");
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingFp, setEditingFp] = useState<FamilyProduct | null>(null);
  const [editLoginLink, setEditLoginLink] = useState("");
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editSelectedVariantIds, setEditSelectedVariantIds] = useState<string[]>([]);
  const [familyProductVariants, setFamilyProductVariants] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();

  const fetchFamilyProducts = async () => {
    const { data } = await supabase
      .from("family_sharing_products")
      .select("id, product_id, login_link, created_at, products(name)")
      .order("created_at", { ascending: true });
    if (data) setFamilyProducts(data as unknown as FamilyProduct[]);

    const { data: links } = await supabase
      .from("family_sharing_product_variants")
      .select("family_product_id, variant_id");
    if (links) {
      const map: Record<string, string[]> = {};
      (links as any[]).forEach((l) => {
        if (!map[l.family_product_id]) map[l.family_product_id] = [];
        map[l.family_product_id].push(l.variant_id);
      });
      setFamilyProductVariants(map);
    }

    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name").order("name");
    if (data) setProducts(data);
  };

  const fetchVariantsForProduct = async (productId: string) => {
    const { data } = await supabase
      .from("product_variations")
      .select("id, name, price, expiry_days")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("sort_order");
    if (data) setProductVariants(data);
    else setProductVariants([]);
  };

  useEffect(() => {
    fetchFamilyProducts();
    fetchProducts();
  }, []);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantIds([]);
    if (productId) fetchVariantsForProduct(productId);
    else setProductVariants([]);
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariantIds(prev =>
      prev.includes(variantId) ? prev.filter(v => v !== variantId) : [...prev, variantId]
    );
  };

  const handleAdd = async () => {
    if (!selectedProductId) return;
    if (selectedVariantIds.length === 0) { toast.error("Select at least one variant"); return; }

    const { data: inserted, error } = await supabase
      .from("family_sharing_products")
      .insert({ product_id: selectedProductId, login_link: loginLink || null })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") toast.error("This product is already added");
      else toast.error(error.message);
      return;
    }

    const variantInserts = selectedVariantIds.map(vid => ({
      family_product_id: inserted.id,
      variant_id: vid,
    }));
    await supabase.from("family_sharing_product_variants").insert(variantInserts);

    toast.success("Family sharing product added");
    setAddOpen(false);
    setSelectedProductId("");
    setLoginLink("");
    setSelectedVariantIds([]);
    setProductVariants([]);
    fetchFamilyProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("family_sharing_products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed");
    fetchFamilyProducts();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">Family Sharing</h2>
        <div className="flex items-center gap-3">
          <OrderSearch navigate={navigate} />
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Family Sharing
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {familyProducts.map((fp, idx) => (
            <TableRow key={fp.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell className="font-medium">{fp.products?.name || "Unknown"}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                    setEditingFp(fp);
                    setEditLoginLink(fp.login_link || "");
                    const { data: vars } = await supabase
                      .from("product_variations")
                      .select("id, name, price, expiry_days")
                      .eq("product_id", fp.product_id)
                      .eq("is_active", true)
                      .order("sort_order");
                    setEditVariants(vars || []);
                    setEditSelectedVariantIds(familyProductVariants[fp.id] || []);
                    setEditOpen(true);
                  }}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/family-sharing/${fp.id}`)}>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(fp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {familyProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No family sharing products added yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Sharing Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedProductId} onValueChange={handleProductChange}>
              <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productVariants.length > 0 && (
              <div>
                <Label>Select Variants</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {productVariants.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                      <Checkbox checked={selectedVariantIds.includes(v.id)} onCheckedChange={() => toggleVariant(v.id)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          NPR {Number(v.price).toLocaleString()}
                          {v.expiry_days ? ` · ${v.expiry_days} days` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="login_link">Login Link</Label>
              <Input id="login_link" placeholder="https://example.com/login" value={loginLink} onChange={(e) => setLoginLink(e.target.value)} />
            </div>
            <Button onClick={handleAdd} className="w-full">Add Product</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit — {editingFp?.products?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_login_link">Login Link</Label>
              <Input id="edit_login_link" placeholder="https://example.com/login" value={editLoginLink} onChange={(e) => setEditLoginLink(e.target.value)} />
            </div>
            {editVariants.length > 0 && (
              <div>
                <Label>Linked Variants</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {editVariants.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                      <Checkbox
                        checked={editSelectedVariantIds.includes(v.id)}
                        onCheckedChange={() =>
                          setEditSelectedVariantIds(prev =>
                            prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id]
                          )
                        }
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          NPR {Number(v.price).toLocaleString()}
                          {v.expiry_days ? ` · ${v.expiry_days} days` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full" onClick={async () => {
              if (!editingFp) return;
              if (editSelectedVariantIds.length === 0) { toast.error("Select at least one variant"); return; }
              const { error } = await supabase.from("family_sharing_products").update({ login_link: editLoginLink || null }).eq("id", editingFp.id);
              if (error) { toast.error(error.message); return; }
              await supabase.from("family_sharing_product_variants").delete().eq("family_product_id", editingFp.id);
              const variantInserts = editSelectedVariantIds.map(vid => ({
                family_product_id: editingFp.id,
                variant_id: vid,
              }));
              await supabase.from("family_sharing_product_variants").insert(variantInserts);
              toast.success("Updated successfully");
              setEditOpen(false);
              fetchFamilyProducts();
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFamilySharing;
