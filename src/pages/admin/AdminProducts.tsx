import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', original_price: '', duration: '',
    image_url: '', category_id: '', is_featured: false, is_bestseller: false,
    is_flash_sale: false, flash_sale_label: '', rating: '', meta_title: '', meta_description: '',
    features: '', stock_status: 'in_stock' as string,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data || [];
    },
  });

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', price: '', original_price: '', duration: '', image_url: '', category_id: '', is_featured: false, is_bestseller: false, is_flash_sale: false, flash_sale_label: '', rating: '', meta_title: '', meta_description: '', features: '', stock_status: 'in_stock' });
    setEditingId(null);
  };

  const openEdit = (product: any) => {
    setForm({
      name: product.name, slug: product.slug, description: product.description || '',
      price: String(product.price), original_price: product.original_price ? String(product.original_price) : '',
      duration: product.duration || '', image_url: product.image_url || '',
      category_id: product.category_id || '', is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false, is_flash_sale: product.is_flash_sale || false,
      flash_sale_label: product.flash_sale_label || '', rating: product.rating ? String(product.rating) : '',
      meta_title: product.meta_title || '', meta_description: product.meta_description || '',
      features: Array.isArray(product.features) ? (product.features as string[]).join('\n') : '',
      stock_status: product.stock_status || 'in_stock',
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description || null,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        duration: form.duration || null,
        image_url: form.image_url || null,
        category_id: form.category_id || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_flash_sale: form.is_flash_sale,
        flash_sale_label: form.flash_sale_label || null,
        rating: form.rating ? parseFloat(form.rating) : null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        features: form.features ? form.features.split('\n').filter(Boolean) : [],
        stock_status: form.stock_status,
      };
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        await supabase.from('products').insert(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false); resetForm();
      toast.success(editingId ? 'Product updated!' : 'Product created!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('products').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted'); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Products</h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated" /></div>
              <div><Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Selling Price</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
              <div><Label>Full Price</Label><Input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} /></div>
              <div><Label>Product Type</Label><Input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="e.g. 1 Year Subscription" /></div>
              <div><Label>Stock Status</Label>
                <Select value={form.stock_status} onValueChange={v => setForm({...form, stock_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
              <div className="col-span-2"><Label>Features (one per line)</Label><Textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={3} /></div>
              <div className="col-span-2"><Label>Flash Sale Label</Label><Input value={form.flash_sale_label} onChange={e => setForm({...form, flash_sale_label: e.target.value})} /></div>
              <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => setForm({...form, meta_title: e.target.value})} /></div>
              <div><Label>Meta Description</Label><Input value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} /></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_featured} onCheckedChange={v => setForm({...form, is_featured: v})} /><Label>Featured</Label></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_bestseller} onCheckedChange={v => setForm({...form, is_bestseller: v})} /><Label>Bestseller</Label></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_flash_sale} onCheckedChange={v => setForm({...form, is_flash_sale: v})} /><Label>Flash Sale</Label></div>
            </div>
            <Button onClick={() => saveMutation.mutate()} className="w-full mt-4" disabled={!form.name || !form.price}>
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Flags</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {products?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{(p.categories as any)?.name || '-'}</TableCell>
                  <TableCell className="text-foreground">${p.price}</TableCell>
                  <TableCell><span className={`text-xs font-medium ${(p as any).stock_status === 'out_of_stock' ? 'text-destructive' : 'text-success'}`}>{(p as any).stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}</span></TableCell>
                  <TableCell className="text-xs space-x-1">
                    {p.is_featured && <span className="text-primary">Featured</span>}
                    {p.is_bestseller && <span className="text-warning">Best</span>}
                    {p.is_flash_sale && <span className="text-destructive">Sale</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
