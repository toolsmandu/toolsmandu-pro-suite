import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, X, ChevronDown, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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
  stock_status: string;
  has_special_input_fields: boolean;
  input_field_ids: string[];
}

const emptyVariation = (): Variation => ({
  name: '',
  price: '',
  original_price: '',
  expiry_days: '',
  variation_info: '',
  is_active: true,
  stock_status: 'in_stock',
  has_special_input_fields: false,
  input_field_ids: [],
});

const emptyForm = () => ({
  name: '',
  slug: '',
  description: '',
  
  region: 'Global',
  image_url: '',
  category_id: '',
  is_featured: false,
  is_bestseller: false,
  is_flash_sale: false,
  flash_sale_label: '',
  single_product_tag: '',
  meta_title: '',
  meta_description: '',
  features: '',
  stock_status: 'in_stock',
  order_mode: 'cart',
  new_in_store_offer_text: '',
  show_in_new_in_store: false,
});

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderModeFilter, setOrderModeFilter] = useState('all');
  const [form, setForm] = useState(emptyForm());
  const [productInputFieldIds, setProductInputFieldIds] = useState<string[]>([]);
  const [infoEditorIndex, setInfoEditorIndex] = useState<number | null>(null);
  const [infoEditorValue, setInfoEditorValue] = useState('');
  const [fieldPickerIndex, setFieldPickerIndex] = useState<number | 'product' | null>(null);

  // Reset to list view when navigating away and back
  useEffect(() => {
    setView('list');
    resetForm();
  }, [location.pathname]);

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

  const { data: singleProductTags } = useQuery({
    queryKey: ['single-product-tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('single_product_tags').select('*').order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allInputFields } = useQuery({
    queryKey: ['input-fields-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('input_fields').select('*').order('name');
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
    setProductInputFieldIds([]);
  };

  const openAdd = () => {
    resetForm();
    setView('form');
  };

  const openEdit = async (product: any) => {
    setForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      
      region: product.region || 'Global',
      image_url: product.image_url || '',
      category_id: product.category_id || '',
      is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false,
      is_flash_sale: product.is_flash_sale || false,
      flash_sale_label: product.flash_sale_label || '',
      single_product_tag: product.single_product_tag || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      features: Array.isArray(product.features) ? product.features.join('\n') : '',
      stock_status: product.stock_status || 'in_stock',
      order_mode: product.order_mode || 'cart',
      new_in_store_offer_text: product.new_in_store_offer_text || '',
    });

    const { data, error } = await supabase
      .from('product_variations')
      .select('*, variation_input_fields(input_field_id)')
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
        stock_status: variation.stock_status || 'in_stock',
        has_special_input_fields: variation.has_special_input_fields || false,
        input_field_ids: (variation.variation_input_fields || []).map((v: any) => v.input_field_id),
      })),
    );

    const { data: pifs } = await supabase
      .from('product_input_fields')
      .select('input_field_id')
      .eq('product_id', product.id);
    setProductInputFieldIds((pifs || []).map((p: any) => p.input_field_id));

    setEditingId(product.id);
    setView('form');
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | boolean | string[]) => {
    setVariations((previous) => previous.map((variation, currentIndex) => (
      currentIndex === index ? { ...variation, [field]: value } : variation
    )));
  };

  const removeVariation = (index: number) => {
    setVariations((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeVariations = variations.filter((variation) => variation.name && variation.price && variation.expiry_days);
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
        
        region: form.region || null,
        image_url: form.image_url || null,
        category_id: form.category_id || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_flash_sale: form.is_flash_sale,
        flash_sale_label: form.flash_sale_label || null,
        single_product_tag: form.single_product_tag || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        features: form.features ? form.features.split('\n').map((item) => item.trim()).filter(Boolean) : [],
        stock_status: form.stock_status,
        order_mode: form.order_mode,
        new_in_store_offer_text: form.new_in_store_offer_text || null,
      };

      let productId = editingId;
      let previousStockStatus: string | null = null;

      if (editingId) {
        const { data: existing } = await supabase
          .from('products')
          .select('stock_status')
          .eq('id', editingId)
          .single();
        previousStockStatus = existing?.stock_status ?? null;

        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      // Auto-notify waiting list when product transitions from out_of_stock back to in_stock
      if (productId && previousStockStatus === 'out_of_stock' && form.stock_status !== 'out_of_stock') {
        try {
          await supabase.functions.invoke('notify-waiting-list', {
            body: { productId, siteOrigin: window.location.origin },
          });
        } catch (e) {
          console.warn('notify-waiting-list invocation failed', e);
        }
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
        stock_status: variation.stock_status || 'in_stock',
        sort_order: index,
        has_special_input_fields: variation.has_special_input_fields,
      }));

      let insertedVariations: any[] = [];
      if (variationPayloads.length > 0) {
        const { data: vData, error } = await supabase.from('product_variations').insert(variationPayloads).select('id');
        if (error) throw error;
        insertedVariations = vData || [];
      }

      // Save product-level input fields
      await supabase.from('product_input_fields').delete().eq('product_id', productId);
      if (productInputFieldIds.length > 0) {
        const pifPayload = productInputFieldIds.map((fid, idx) => ({
          product_id: productId, input_field_id: fid, sort_order: idx,
        }));
        await supabase.from('product_input_fields').insert(pifPayload);
      }

      // Save variation-level input fields (only when has_special_input_fields)
      const vifPayload: any[] = [];
      activeVariations.forEach((v, idx) => {
        const vid = insertedVariations[idx]?.id;
        if (!vid || !v.has_special_input_fields) return;
        v.input_field_ids.forEach((fid, fidx) => {
          vifPayload.push({ variation_id: vid, input_field_id: fid, sort_order: fidx });
        });
      });
      if (vifPayload.length > 0) {
        await supabase.from('variation_input_fields').insert(vifPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingId ? 'Product updated!' : 'Product created!');
      setView('list');
      resetForm();
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
      if (editingId) {
        setView('list');
        resetForm();
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // LIST VIEW
  if (view === 'list') {
    return (
      <div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
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
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Home Label</TableHead>
                  <TableHead>Product Label</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => {
                  const categoryName = (product.categories as { name?: string } | null)?.name || '-';
                  return (
                    <TableRow key={product.id} className="cursor-pointer" onClick={() => openEdit(product)}>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{categoryName}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${product.stock_status === 'out_of_stock' ? 'text-destructive' : 'text-success'}`}>
                          {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">NPR {product.price}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {product.flash_sale_label || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {product.single_product_tag || '-'}
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
    );
  }

  // Compute missing fields for save button
  const saveMissing: string[] = [];
  if (!form.name) saveMissing.push('Product Name');
  if (!form.category_id) saveMissing.push('Category');
  if (!form.region) saveMissing.push('Region');
  const validVariationsForSave = variations.filter((v) => v.name && v.price && v.expiry_days);
  if (validVariationsForSave.length === 0) {
    const incompleteIdx: string[] = [];
    variations.forEach((v, i) => {
      const miss: string[] = [];
      if (!v.name) miss.push('name');
      if (!v.price) miss.push('price');
      if (!v.expiry_days) miss.push('expiry days');
      if (miss.length) incompleteIdx.push(`Variation ${i + 1} (${miss.join(', ')})`);
    });
    if (incompleteIdx.length === 0) saveMissing.push('At least one variation');
    else saveMissing.push(...incompleteIdx);
  }
  const saveDisabled = saveMissing.length > 0;
  const renderSaveButton = () => {
    const btn = (
      <Button
        onClick={() => saveMutation.mutate()}
        size="icon"
        className="h-8 w-8"
        disabled={saveDisabled}
        aria-label={editingId ? 'Update Product' : 'Create Product'}
        title={editingId ? 'Update Product' : 'Create Product'}
      >
        <Save className="h-4 w-4" />
      </Button>
    );
    if (!saveDisabled) return btn;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block cursor-not-allowed">
              <div className="pointer-events-none">{btn}</div>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-semibold mb-1">Please complete the following:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {saveMissing.map((m) => (<li key={m} className="text-xs">{m}</li>))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // FORM VIEW (full area)
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => { setView('list'); resetForm(); }}>
          ← Back
        </Button>
        <h2 className="text-2xl font-bold text-foreground">{editingId ? 'Edit Product' : 'Add Product'}</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="w-full">
          <div className="space-y-4">
              {/* Row 1: Product Name, Slug, Category, Region */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-1">
                  <Label>Product Name *</Label>
                  <Input value={form.name} onChange={(event) => {
                    const name = event.target.value;
                    const autoSlug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                    const currentAutoSlug = form.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                    const slugWasAuto = !form.slug || form.slug === currentAutoSlug;
                    setForm({ ...form, name, slug: slugWasAuto ? autoSlug : form.slug });
                  }} />
                </div>
                <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated" />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <select value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className={selectClassName}>
                      <option value="">Select category</option>
                      {categories?.map((category: any) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Region *</Label>
                    <Input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} placeholder="e.g. Global, Nepal" />
                  </div>
                </div>
              </div>

              {/* Row 3: Stock Status, Order Mode, Flash Sale Label, Featured Tags */}
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Stock Status</Label>
                  <select value={form.stock_status} onChange={(event) => setForm({ ...form, stock_status: event.target.value })} className={selectClassName}>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <Label>Order Mode</Label>
                  <select value={form.order_mode} onChange={(event) => setForm({ ...form, order_mode: event.target.value })} className={selectClassName}>
                    <option value="cart">Online Order (Add to Cart)</option>
                    <option value="whatsapp">Order via WhatsApp</option>
                  </select>
                </div>
                <div>
                  <Label>Homepage Product Tag</Label>
                  <select value={form.flash_sale_label} onChange={(event) => setForm({ ...form, flash_sale_label: event.target.value })} className={selectClassName}>
                    <option value="">No Label</option>
                    {flashSaleLabels?.map((label: any) => (
                      <option key={label.id} value={label.label}>{label.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Single Product Tag</Label>
                  <select value={form.single_product_tag} onChange={(event) => setForm({ ...form, single_product_tag: event.target.value })} className={selectClassName}>
                    <option value="">No Tag</option>
                    {singleProductTags?.map((tag: any) => (
                      <option key={tag.id} value={tag.label}>{tag.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image + Product-level Input Fields side by side */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <ImageUpload value={form.image_url} onChange={(value) => setForm({ ...form, image_url: value })} label="Product Image" />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>New in Store Offer Text</Label>
                    <Input
                      value={form.new_in_store_offer_text}
                      onChange={(e) => setForm({ ...form, new_in_store_offer_text: e.target.value })}
                      placeholder="Shown below product title in the New in Store section"
                    />
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Custom Input Fields (Product-level)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setFieldPickerIndex('product')}>
                        <Plus className="h-3 w-3 mr-1" /> Choose Fields
                      </Button>
                    </div>
                    {productInputFieldIds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No fields attached. These show on the product page above Add to Cart unless a selected variation has its own special fields.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {productInputFieldIds.map((fid) => {
                          const f = (allInputFields || []).find((x: any) => x.id === fid);
                          return (
                            <span key={fid} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                              {f?.name || 'Unknown'}
                              <button type="button" className="text-destructive" onClick={() => setProductInputFieldIds(productInputFieldIds.filter((x) => x !== fid))}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Title + Meta Description */}
              <div>
                <Label>Meta Title</Label>
                <Input value={form.meta_title} onChange={(event) => setForm({ ...form, meta_title: event.target.value })} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Input value={form.meta_description} onChange={(event) => setForm({ ...form, meta_description: event.target.value })} />
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <RichTextEditor value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
              </div>

              {/* Variations */}
              <div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Variations</Label>
                </div>

                {variations.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variations yet. Add at least one variation with pricing.</p>
                )}

                <div className="space-y-3">
                  {variations.map((variation, index) => (
                    <div key={variation.id || index} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-medium text-foreground">Variation {index + 1}</span>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={variation.has_special_input_fields}
                              onCheckedChange={(c) => updateVariation(index, 'has_special_input_fields', !!c)}
                              id={`special-${index}`}
                            />
                            <Label htmlFor={`special-${index}`} className="text-xs cursor-pointer">Add Special Input Field</Label>
                            {variation.has_special_input_fields && (
                              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setFieldPickerIndex(index)}>
                                <Plus className="h-3 w-3 mr-1" /> Choose Fields
                              </Button>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setInfoEditorValue(variation.variation_info || '');
                              setInfoEditorIndex(index);
                            }}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            {variation.variation_info ? 'Edit Info' : 'Add Info'}
                          </Button>
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

                      {/* All fields on one line: Name, Stock, Expiry, Selling Price, Has Full Price toggle, Full Price */}
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[140px]">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={variation.name}
                            onChange={(event) => updateVariation(index, 'name', event.target.value)}
                            placeholder="e.g. 1 Month, 1 Year"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <Label className="text-xs">Stock Status</Label>
                          <select
                            value={variation.stock_status}
                            onChange={(event) => updateVariation(index, 'stock_status', event.target.value)}
                            className={selectClassName + ' h-8 text-sm'}
                          >
                            <option value="in_stock">In Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          <Label className="text-xs">Expiry Days <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            value={variation.expiry_days}
                            onChange={(event) => updateVariation(index, 'expiry_days', event.target.value)}
                            placeholder="e.g. 30, 365"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-[110px]">
                          <Label className="text-xs">Selling Price <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            value={variation.price}
                            onChange={(event) => updateVariation(index, 'price', event.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1 pb-2">
                          <Checkbox
                            id={`hasfull-${index}`}
                            checked={!!variation.original_price}
                            onCheckedChange={(c) => {
                              if (!c) updateVariation(index, 'original_price', '');
                              else updateVariation(index, 'original_price', variation.original_price || '0');
                            }}
                          />
                          <Label htmlFor={`hasfull-${index}`} className="text-xs cursor-pointer whitespace-nowrap">Full Price</Label>
                        </div>
                        {!!variation.original_price && (
                          <div className="flex-1 min-w-[110px]">
                            <Label className="text-xs">Full Price</Label>
                            <Input
                              type="number"
                              value={variation.original_price}
                              onChange={(event) => updateVariation(index, 'original_price', event.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {variation.has_special_input_fields && variation.input_field_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          {variation.input_field_ids.map((fid) => {
                            const f = (allInputFields || []).find((x: any) => x.id === fid);
                            return (
                              <span key={fid} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                                {f?.name || 'Unknown'}
                                <button type="button" className="text-destructive" onClick={() => updateVariation(index, 'input_field_ids', variation.input_field_ids.filter((x) => x !== fid))}>
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setVariations((previous) => [...previous, emptyVariation()])}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variation
                  </Button>
                </div>
              </div>

              <Dialog open={infoEditorIndex !== null} onOpenChange={(open) => { if (!open) setInfoEditorIndex(null); }}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Variation Info</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto">
                    <RichTextEditor value={infoEditorValue} onChange={setInfoEditorValue} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInfoEditorIndex(null)}>Cancel</Button>
                    <Button
                      onClick={() => {
                        if (infoEditorIndex !== null) {
                          updateVariation(infoEditorIndex, 'variation_info', infoEditorValue);
                        }
                        setInfoEditorIndex(null);
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Field picker dialog */}
              <Dialog open={fieldPickerIndex !== null} onOpenChange={(open) => { if (!open) setFieldPickerIndex(null); }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Choose Input Fields</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {(allInputFields || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No input fields available. Create them in <strong>Products → Input Fields</strong>.
                      </p>
                    ) : (
                      (allInputFields || []).map((f: any) => {
                        const selectedIds =
                          fieldPickerIndex === 'product'
                            ? productInputFieldIds
                            : (variations[fieldPickerIndex as number]?.input_field_ids || []);
                        const checked = selectedIds.includes(f.id);
                        return (
                          <label key={f.id} className="flex items-center gap-3 p-2 border border-border rounded-md cursor-pointer hover:bg-muted/50">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                const next = c ? [...selectedIds, f.id] : selectedIds.filter((x) => x !== f.id);
                                if (fieldPickerIndex === 'product') {
                                  setProductInputFieldIds(next);
                                } else {
                                  updateVariation(fieldPickerIndex as number, 'input_field_ids', next);
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{f.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {f.field_type}{f.is_required ? ' • Required' : ''}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setFieldPickerIndex(null)}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        </div>
      </ScrollArea>
      <div className="border-t border-border pt-3 mt-2 flex justify-center">
        {saveDisabled ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-block cursor-not-allowed">
                  <div className="pointer-events-none">
                    <Button disabled>{editingId ? 'Update Product' : 'Create Product'}</Button>
                  </div>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold mb-1">Please complete the following:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {saveMissing.map((m) => (<li key={m} className="text-xs">{m}</li>))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button onClick={() => saveMutation.mutate()}>
            {editingId ? 'Update Product' : 'Create Product'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;