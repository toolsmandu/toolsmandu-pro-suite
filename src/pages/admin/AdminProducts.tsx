import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Variation {
  id?: string;
  name: string;
  price: string;
  original_price: string;
  expiry_days: string;
  variation_info: string;
  is_active: boolean;
}

const emptyVariation = (): Variation => ({ name: '', price: '', original_price: '', expiry_days: '', variation_info: '', is_active: true });

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', duration: '', region: '',
    image_url: '', category_id: '', is_featured: false, is_bestseller: false,
    is_flash_sale: false, flash_sale_label: '', meta_title: '', meta_description: '',
    features: '', stock_status: 'in_stock' as string, order_mode: 'cart' as string,
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

  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: async () => {
      const { data } = await supabase.from('product_types').select('*').order('name');
      return data || [];
    },
  });

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', duration: '', region: '', image_url: '', category_id: '', is_featured: false, is_bestseller: false, is_flash_sale: false, flash_sale_label: '', meta_title: '', meta_description: '', features: '', stock_status: 'in_stock', order_mode: 'cart' });
    setVariations([]);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = async (product: any) => {
    setForm({
      name: product.name, slug: product.slug, description: product.description || '',
      duration: product.duration || '', region: product.region || '',
      image_url: product.image_url || '',
      category_id: product.category_id || '', is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false, is_flash_sale: product.is_flash_sale || false,
      flash_sale_label: product.flash_sale_label || '', meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      features: Array.isArray(product.features) ? (product.features as string[]).join('\n') : '',
      stock_status: product.stock_status || 'in_stock',
      order_mode: product.order_mode || 'cart',
    });
    const { data } = await supabase.from('product_variations').select('*').eq('product_id', product.id).order('sort_order');
    setVariations((data || []).map((v: any) => ({
      id: v.id, name: v.name, price: String(v.price),
      original_price: v.original_price ? String(v.original_price) : '',
      expiry_days: v.expiry_days ? String(v.expiry_days) : '',
      variation_info: v.variation_info || '', is_active: v.is_active,
    })));
    setEditingId(product.id);
    setShowForm(true);
  };

  const updateVariation = (index: number, field: keyof Variation, value: any) => {
    setVariations(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeVariations = variations.filter(v => v.name && v.price);
      const lowestPrice = activeVariations.length > 0
        ? Math.min(...activeVariations.map(v => parseFloat(v.price)))
        : 0;
      const highestOriginal = activeVariations.length > 0
        ? Math.max(...activeVariations.filter(v => v.original_price).map(v => parseFloat(v.original_price)).filter(p => !isNaN(p)), 0)
        : null;

      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description || null,
        price: lowestPrice,
        original_price: highestOriginal || null,
        duration: form.duration || null,
        region: form.region || null,
        image_url: form.image_url || null,
        category_id: form.category_id || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_flash_sale: form.is_flash_sale,
        flash_sale_label: form.flash_sale_label || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        features: form.features ? form.features.split('\n').filter(Boolean) : [],
        stock_status: form.stock_status,
        order_mode: form.order_mode,
      };

      let productId = editingId;
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      if (productId) {
        await supabase.from('product_variations').delete().eq('product_id', productId);
        const variationPayloads = activeVariations.map((v, i) => ({
          product_id: productId!,
          name: v.name,
          price: parseFloat(v.price),
          original_price: v.original_price ? parseFloat(v.original_price) : null,
          expiry_days: v.expiry_days ? parseInt(v.expiry_days) : null,
          variation_info: v.variation_info || null,
          is_active: v.is_active,
          sort_order: i,
        }));
        if (variationPayloads.length > 0) {
          const { error } = await supabase.from('product_variations').insert(variationPayloads);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      resetForm();
      toast.success(editingId ? 'Product updated!' : 'Product created!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('products').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted'); },
  });

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Products List */}
      <div className={`${showForm ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
        </div>

        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Flags</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {products?.map(p => (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer ${editingId === p.id ? 'bg-muted/50' : ''}`}
                    onClick={() => openEdit(p)}
                  >
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(p.categories as any)?.name || '-'}</TableCell>
                    <TableCell className="text-foreground">NPR {p.price}</TableCell>
                    <TableCell><span className={`text-xs font-medium ${(p as any).stock_status === 'out_of_stock' ? 'text-destructive' : 'text-success'}`}>{(p as any).stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}</span></TableCell>
                    <TableCell className="text-xs space-x-1">
                      {p.is_featured && <span className="text-primary">Featured</span>}
                      {p.is_bestseller && <span className="text-warning">Best</span>}
                      {p.is_flash_sale && <span className="text-destructive">Sale</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Panel */}
      {showForm && (
        <div className="w-full lg:w-[520px] lg:min-w-[520px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated" /></div>
              <div><Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Product Type</Label>
                <Select value={form.duration} onValueChange={v => setForm({...form, duration: v})}>
                  <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">{productTypes?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Region</Label><Input value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="e.g. Global, Nepal" /></div>
              <div><Label>Stock Status</Label>
                <Select value={form.stock_status} onValueChange={v => setForm({...form, stock_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Order Mode</Label>
                <Select value={form.order_mode} onValueChange={v => setForm({...form, order_mode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="cart">Online Order (Add to Cart)</SelectItem>
                    <SelectItem value="whatsapp">Order via WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><ImageUpload value={form.image_url} onChange={v => setForm({...form, image_url: v})} label="Product Image" /></div>
              <div className="col-span-2"><Label>Description</Label><RichTextEditor value={form.description} onChange={v => setForm({...form, description: v})} /></div>

              {/* Variations Section */}
              <div className="col-span-2">
                <Separator className="my-2" />
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Variations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setVariations(prev => [...prev, emptyVariation()])}>
                    <Plus className="h-3 w-3 mr-1" /> Add Variation
                  </Button>
                </div>
                {variations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variations yet. Add at least one variation with pricing.</p>
                )}
                <div className="space-y-3">
                  {variations.map((v, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Variation {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch checked={v.is_active} onCheckedChange={val => updateVariation(i, 'is_active', val)} />
                            <span className={`text-xs ${v.is_active ? 'text-success' : 'text-muted-foreground'}`}>{v.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariation(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={v.name} onChange={e => updateVariation(i, 'name', e.target.value)} placeholder="e.g. 1 Month, 1 Year" className="h-8 text-sm" /></div>
                        <div><Label className="text-xs">Selling Price</Label><Input type="number" value={v.price} onChange={e => updateVariation(i, 'price', e.target.value)} className="h-8 text-sm" /></div>
                        <div><Label className="text-xs">Full Price</Label><Input type="number" value={v.original_price} onChange={e => updateVariation(i, 'original_price', e.target.value)} className="h-8 text-sm" /></div>
                        <div className="col-span-2"><Label className="text-xs">Expiry Days (validity after order)</Label><Input type="number" value={v.expiry_days} onChange={e => updateVariation(i, 'expiry_days', e.target.value)} placeholder="e.g. 30, 365" className="h-8 text-sm" /></div>
                        <div className="col-span-2"><Label className="text-xs">Variation Info</Label><Input value={v.variation_info} onChange={e => updateVariation(i, 'variation_info', e.target.value)} placeholder="e.g. 1 Year License, Family Plan" className="h-8 text-sm" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2"><Label>Flash Sale Label</Label><Input value={form.flash_sale_label} onChange={e => setForm({...form, flash_sale_label: e.target.value})} /></div>
              <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => setForm({...form, meta_title: e.target.value})} /></div>
              <div><Label>Meta Description</Label><Input value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} /></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_featured} onCheckedChange={v => setForm({...form, is_featured: v})} /><Label>Featured</Label></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_bestseller} onCheckedChange={v => setForm({...form, is_bestseller: v})} /><Label>Bestseller</Label></div>
              <div className="flex items-center gap-4"><Switch checked={form.is_flash_sale} onCheckedChange={v => setForm({...form, is_flash_sale: v})} /><Label>Flash Sale</Label></div>
            </div>
            <Button onClick={() => saveMutation.mutate()} className="w-full mt-4" disabled={!form.name || variations.filter(v => v.name && v.price).length === 0}>
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
