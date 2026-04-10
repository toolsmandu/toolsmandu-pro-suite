import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

interface Variation {
  id?: string;
  name: string;
  price: string;
  original_price: string;
  expiry_days: string;
  variation_info: string;
  is_active: boolean;
}

const emptyVariation = (): Variation => ({
  name: '',
  price: '',
  original_price: '',
  expiry_days: '',
  variation_info: '',
  is_active: true,
});

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  duration: '',
  region: '',
  image_url: '',
  category_id: '',
  is_featured: false,
  is_bestseller: false,
  is_flash_sale: false,
  flash_sale_label: '',
  meta_title: '',
  meta_description: '',
  features: '',
  stock_status: 'in_stock',
  order_mode: 'cart',
});

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderModeFilter, setOrderModeFilter] = useState('all');
  const [form, setForm] = useState(emptyForm());

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_types').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: flashSaleLabels } = useQuery({
    queryKey: ['flash-sale-labels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flash_sale_labels').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return (products || []).filter((product: any) => {
      const categoryName = (product.categories as { name?: string } | null)?.name || '';
      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.slug?.toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term) ||
        product.region?.toLowerCase().includes(term);

      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchesStock = stockFilter === 'all' || product.stock_status === stockFilter;
      const matchesOrderMode = orderModeFilter === 'all' || product.order_mode === orderModeFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesOrderMode;
    });
  }, [products, searchTerm, categoryFilter, stockFilter, orderModeFilter]);

  const resetForm = () => {
    setForm(emptyForm());
    setVariations([]);
    setEditingId(null);
  };

  const closePanel = () => {
    setPanelOpen(false);
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = async (product: any) => {
    setForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      duration: product.duration || '',
      region: product.region || '',
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false,
      is_flash_sale: product.is_flash_sale || false,
      flash_sale_label: product.flash_sale_label || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      features: Array.isArray(product.features) ? product.features.join('\n') : '',
      stock_status: product.stock_status || 'in_stock',
      order_mode: product.order_mode || 'cart',
    });

    const { data, error } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order');

    if (error) {
      toast.error(error.message);
      return;
    }

    setVariations(
      (data || []).map((variation: any) => ({
        id: variation.id,
        name: variation.name,
        price: String(variation.price),
        original_price: variation.original_price ? String(variation.original_price) : '',
        expiry_days: variation.expiry_days ? String(variation.expiry_days) : '',
        variation_info: variation.variation_info || '',
        is_active: variation.is_active,
      })),
    );

    setEditingId(product.id);
    setPanelOpen(true);
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | boolean) => {
    setVariations((previous) => previous.map((variation, currentIndex) => (
      currentIndex === index ? { ...variation, [field]: value } : variation
    )));
  };

  const removeVariation = (index: number) => {
    setVariations((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeVariations = variations.filter((variation) => variation.name && variation.price);
      const prices = activeVariations.map((variation) => Number.parseFloat(variation.price)).filter((value) => !Number.isNaN(value));
      const originalPrices = activeVariations
        .map((variation) => Number.parseFloat(variation.original_price))
        .filter((value) => !Number.isNaN(value));

      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().trim().replace(/\s+/g, '-'),
        description: form.description || null,
        price: prices.length > 0 ? Math.min(...prices) : 0,
        original_price: originalPrices.length > 0 ? Math.max(...originalPrices) : null,
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
        features: form.features ? form.features.split('\n').map((item) => item.trim()).filter(Boolean) : [],
        stock_status: form.stock_status,
        order_mode: form.order_mode,
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      if (!productId) return;

      const { error: deleteError } = await supabase.from('product_variations').delete().eq('product_id', productId);
      if (deleteError) throw deleteError;

      const variationPayloads = activeVariations.map((variation, index) => ({
        product_id: productId,
        name: variation.name,
        price: Number.parseFloat(variation.price),
        original_price: variation.original_price ? Number.parseFloat(variation.original_price) : null,
        expiry_days: variation.expiry_days ? Number.parseInt(variation.expiry_days, 10) : null,
        variation_info: variation.variation_info || null,
        is_active: variation.is_active,
        sort_order: index,
      }));

      if (variationPayloads.length > 0) {
        const { error } = await supabase.from('product_variations').insert(variationPayloads);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingId ? 'Product updated!' : 'Product created!');
      closePanel();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
      if (editingId) closePanel();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      <div className={`${panelOpen ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">Products</h2>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products"
                className="pl-9"
              />
            </div>

            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={selectClassName}>
              <option value="all">All Categories</option>
              {categories?.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className={selectClassName}>
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select value={orderModeFilter} onChange={(event) => setOrderModeFilter(event.target.value)} className={selectClassName}>
              <option value="all">All Order Modes</option>
              <option value="cart">Online Order</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Mode</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => {
                  const categoryName = (product.categories as { name?: string } | null)?.name || '-';
                  const isSelected = editingId === product.id && panelOpen;

                  return (
                    <TableRow key={product.id} className={`cursor-pointer ${isSelected ? 'bg-muted/50' : ''}`} onClick={() => openEdit(product)}>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{categoryName}</TableCell>
                      <TableCell className="text-foreground">NPR {product.price}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${product.stock_status === 'out_of_stock' ? 'text-destructive' : 'text-success'}`}>
                          {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.order_mode === 'whatsapp' ? 'WhatsApp' : 'Online Order'}
                      </TableCell>
                      <TableCell className="text-xs space-x-1">
                        {product.is_featured && <span className="text-primary">Featured</span>}
                        {product.is_bestseller && <span className="text-warning">Best</span>}
                        {product.is_flash_sale && <span className="text-destructive">Sale</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openEdit(product);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteMutation.mutate(product.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="w-full lg:w-[640px] lg:min-w-[640px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    placeholder="auto-generated"
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <select
                    value={form.category_id}
                    onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="">Select category</option>
                    {categories?.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Product Type</Label>
                  <select
                    value={form.duration}
                    onChange={(event) => setForm({ ...form, duration: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="">Select product type</option>
                    {productTypes?.map((productType: any) => (
                      <option key={productType.id} value={productType.name}>
                        {productType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Region</Label>
                  <Input
                    value={form.region}
                    onChange={(event) => setForm({ ...form, region: event.target.value })}
                    placeholder="e.g. Global, Nepal"
                  />
                </div>

                <div>
                  <Label>Stock Status</Label>
                  <select
                    value={form.stock_status}
                    onChange={(event) => setForm({ ...form, stock_status: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <Label>Order Mode</Label>
                  <select
                    value={form.order_mode}
                    onChange={(event) => setForm({ ...form, order_mode: event.target.value })}
                    className={selectClassName}
                  >
                    <option value="cart">Online Order (Add to Cart)</option>
                    <option value="whatsapp">Order via WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUpload value={form.image_url} onChange={(value) => setForm({ ...form, image_url: value })} label="Product Image" />
              </div>

              <div>
                <Label>Description</Label>
                <RichTextEditor value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
              </div>

              <div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Variations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setVariations((previous) => [...previous, emptyVariation()])}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variation
                  </Button>
                </div>

                {variations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variations yet. Add at least one variation with pricing.</p>
                )}

                <div className="space-y-3">
                  {variations.map((variation, index) => (
                    <div key={variation.id || index} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Variation {index + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch checked={variation.is_active} onCheckedChange={(value) => updateVariation(index, 'is_active', value)} />
                            <span className={`text-xs ${variation.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                              {variation.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariation(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={variation.name}
                            onChange={(event) => updateVariation(index, 'name', event.target.value)}
                            placeholder="e.g. 1 Month, 1 Year"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Selling Price</Label>
                          <Input
                            type="number"
                            value={variation.price}
                            onChange={(event) => updateVariation(index, 'price', event.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Full Price</Label>
                          <Input
                            type="number"
                            value={variation.original_price}
                            onChange={(event) => updateVariation(index, 'original_price', event.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs">Expiry Days (validity after order)</Label>
                          <Input
                            type="number"
                            value={variation.expiry_days}
                            onChange={(event) => updateVariation(index, 'expiry_days', event.target.value)}
                            placeholder="e.g. 30, 365"
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs">Variation Info</Label>
                          <Input
                            value={variation.variation_info}
                            onChange={(event) => updateVariation(index, 'variation_info', event.target.value)}
                            placeholder="e.g. 1 Year License, Family Plan"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Flash Sale Label</Label>
                <select
                  value={form.flash_sale_label}
                  onChange={(event) => setForm({ ...form, flash_sale_label: event.target.value })}
                  className={selectClassName}
                >
                  <option value="">No Label</option>
                  {flashSaleLabels?.map((label: any) => (
                    <option key={label.id} value={label.label}>
                      {label.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={form.meta_title} onChange={(event) => setForm({ ...form, meta_title: event.target.value })} />
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Input value={form.meta_description} onChange={(event) => setForm({ ...form, meta_description: event.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4">
                  <Switch checked={form.is_featured} onCheckedChange={(value) => setForm({ ...form, is_featured: value })} />
                  <Label>Featured</Label>
                </div>

                <div className="flex items-center gap-4">
                  <Switch checked={form.is_bestseller} onCheckedChange={(value) => setForm({ ...form, is_bestseller: value })} />
                  <Label>Bestseller</Label>
                </div>

                <div className="flex items-center gap-4">
                  <Switch checked={form.is_flash_sale} onCheckedChange={(value) => setForm({ ...form, is_flash_sale: value })} />
                  <Label>Flash Sale</Label>
                </div>
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                className="w-full mb-2"
                disabled={!form.name || variations.filter((variation) => variation.name && variation.price).length === 0}
              >
                {editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;