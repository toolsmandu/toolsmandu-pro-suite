import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, Check, ClipboardList, Wrench } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import NotifyMe from '@/components/NotifyMe';
import InputFieldRenderer, { validateField, type InputFieldDef } from '@/components/InputFieldRenderer';
import { toast } from 'sonner';
import AdobeTemplate from '@/components/product-templates/adobe/AdobeTemplate';

const ProductFAQs = ({ productName }: { productName: string }) => {
  const { data: faqs } = useQuery({
    queryKey: ['product-faqs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  if (!faqs?.length) return null;

  const replacePlaceholder = (text: string) => text.replace(/\[product\]/gi, productName);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-1 rounded-full" style={{ background: 'linear-gradient(180deg, #228be6, #15aabf)' }} />
        <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
      </div>
      <Card className="overflow-hidden border-border/50" style={{ backgroundColor: 'rgba(10, 46, 92, 0.5)' }}>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={faq.id} value={faq.id} className={cn("border-border/30", idx === faqs.length - 1 && "border-b-0")}>
              <AccordionTrigger className="px-5 py-4 text-sm font-semibold text-foreground text-left hover:no-underline transition-colors [&[data-state=open]]:text-[rgb(249,112,21)] hover:text-[rgb(249,112,21)] [&>span]:text-left [&>*]:text-left">
                <span className="flex-1 text-left">{replacePlaceholder(faq.question)}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 text-sm text-white leading-relaxed text-left">
                {replacePlaceholder(faq.answer)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams();
  const { addItem, items } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variations(*)')
        .eq('slug', slug!)
        .single();
      return data;
    },
    enabled: !!slug,
  });


  const activeVariations = ((product as any)?.product_variations as any[] || [])
    .filter((v: any) => v.is_active && v.stock_status !== 'out_of_stock')
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [orderMode, setOrderMode] = useState('cart');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [productTopBannerImage, setProductTopBannerImage] = useState('');
  const [productTopBannerOpacity, setProductTopBannerOpacity] = useState(1);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useQuery({
    queryKey: ['order-mode-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', ['order_mode', 'whatsapp_number', 'product_banner_image', 'product_top_banner_image', 'product_top_banner_opacity', 'maintenance_mode']);
      data?.forEach((s: any) => {
        if (s.key === 'order_mode') setOrderMode(s.value);
        if (s.key === 'whatsapp_number') setWhatsappNumber(s.value);
        if (s.key === 'product_banner_image') setBannerImage(s.value);
        if (s.key === 'product_top_banner_image') setProductTopBannerImage(s.value);
        if (s.key === 'product_top_banner_opacity') {
          const n = parseFloat(s.value);
          if (!isNaN(n)) setProductTopBannerOpacity(Math.max(0, Math.min(1, n)));
        }
        if (s.key === 'maintenance_mode') setMaintenanceMode(s.value === 'true');
      });
      return data;
    },
  });

  // No variation selected by default — user must pick one

  const { data: productFieldsData } = useQuery({
    queryKey: ['product-input-fields', product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('product_input_fields')
        .select('input_field_id, sort_order, input_fields(*)')
        .eq('product_id', product!.id)
        .order('sort_order');
      return (data || []).map((r: any) => r.input_fields).filter(Boolean);
    },
  });

  const { data: variantFieldsData } = useQuery({
    queryKey: ['variation-input-fields', selectedVariant?.id],
    enabled: !!selectedVariant?.id && !!selectedVariant?.has_special_input_fields,
    queryFn: async () => {
      const { data } = await supabase
        .from('variation_input_fields')
        .select('input_field_id, sort_order, input_fields(*)')
        .eq('variation_id', selectedVariant.id)
        .order('sort_order');
      return (data || []).map((r: any) => r.input_fields).filter(Boolean);
    },
  });

  const activeFields: InputFieldDef[] =
    selectedVariant?.has_special_input_fields
      ? (variantFieldsData as any[]) || []
      : (productFieldsData as any[]) || [];

  // Reset field values when variant changes
  useEffect(() => {
    setFieldValues({});
    setFieldErrors({});
  }, [selectedVariant?.id]);

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variations(*)')
        .eq('category_id', product!.category_id!)
        .neq('id', product!.id)
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  const isOutOfStock = (product as any)?.stock_status === 'out_of_stock';
  const features = (product?.features as string[] | null) || [];

  const isVariantInCart = product && selectedVariant
    ? items.some(i => i.id === product.id && i.variantId === selectedVariant.id)
    : product ? items.some(i => i.id === product.id && !i.variantId) : false;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (isVariantInCart) {
      navigate('/cart');
      return;
    }

    // Validate input fields
    const errs: Record<string, string> = {};
    activeFields.forEach((f) => {
      const err = validateField(f, fieldValues[f.id]);
      if (err) errs[f.id] = err;
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error('Please fill all required fields');
      return;
    }

    const responses = activeFields.map((f) => ({
      field_id: f.id,
      field_name: f.name,
      field_type: f.field_type,
      label: f.label,
      question: f.question,
      value: fieldValues[f.id] ?? (f.field_type === 'checkbox' && f.checkbox_mode === 'multi' ? [] : ''),
    }));

    if (selectedVariant) {
      addItem({
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image_url: product.image_url,
        duration: product.duration,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        inputFieldResponses: responses,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        duration: product.duration,
        inputFieldResponses: responses,
      });
    }
  };

  if (isLoading) return null;

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
      <Button asChild><Link to="/">Back to Home</Link></Button>
    </div>
  );

  if ((product as any).custom_template && (product as any).custom_template !== 'default') {
    return <AdobeTemplate productId={(product as any).id} />;
  }

  return (
    <>
      <div className="relative">
        {productTopBannerImage && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[180px] sm:h-[260px] lg:h-[420px] overflow-hidden"
          >
            <div
              className="absolute inset-0 [background-size:100%_100%]"
              style={{
                backgroundImage: `url(${productTopBannerImage})`,
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
                opacity: productTopBannerOpacity,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, hsl(214 64% 24% / 0) 0%, hsl(214 64% 24% / 0) 40%, hsl(214 64% 24% / 0.35) 60%, hsl(214 64% 24% / 0.75) 80%, hsl(214 64% 24% / 1) 100%)',
              }}
            />
          </div>
        )}
        <div className="container mx-auto px-4 pt-[80px] lg:pt-[125px] pb-8 relative z-10">



        {(() => {
          const planCard = (
            <Card className="p-6" style={{ backgroundColor: '#0a2e5c' }}>
              <h3 className="font-bold text-foreground text-lg mb-4">
                Select a Plan
              </h3>

              {activeVariations.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {activeVariations.map((v: any) => {
                    const isSelected = selectedVariant?.id === v.id;

                    return (
                      <div
                        key={v.id}
                        className={cn(
                          "w-full border-2 rounded-xl transition-all overflow-hidden",
                          isSelected
                            ? "bg-[#228be6]/10 border-[#228be6] ring-1 ring-[#15aabf]"
                            : "bg-white/5 border-white/10 hover:border-[#228be6]/50 hover:bg-white/10",
                          isOutOfStock && "opacity-50"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          disabled={isOutOfStock}
                          className={cn(
                            "w-full text-left flex items-center gap-4 p-4",
                            isOutOfStock && "cursor-not-allowed"
                          )}
                        >
                          <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-semibold text-foreground text-sm">{v.name}</div>
                            <div className="font-semibold text-sm" style={{ color: '#16a249' }}>NPR {v.price}</div>
                          </div>

                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            !isSelected && "bg-white/10"
                          )} style={isSelected ? { background: 'linear-gradient(90deg, #228be6, #15aabf)' } : undefined}>
                            {isSelected ? (
                              <Check className="h-5 w-5 text-white" />
                            ) : (
                              <ShoppingCart className="h-5 w-5 text-white/40" />
                            )}
                          </div>
                        </button>

                        {isSelected && v.variation_info && (
                          <div
                            className="mx-4 mb-4 rounded-lg p-4 animate-in fade-in slide-in-from-top-1 duration-200"
                            style={{
                              border: '1.5px dashed rgba(34, 139, 230, 0.5)',
                              background: 'linear-gradient(135deg, rgba(34,139,230,0.10), rgba(21,170,191,0.08))',
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-4 w-1 rounded-full" style={{ background: 'linear-gradient(180deg, #228be6, #15aabf)' }} />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Plan Details:</h4>
                            </div>
                            <div
                              className="text-sm text-white/90 leading-relaxed prose prose-sm prose-invert max-w-none [&_a]:underline [&_a]:text-[#15aabf] [&_img]:rounded-md [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_p+p]:mt-2"
                              dangerouslySetInnerHTML={{ __html: v.variation_info }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm mb-4">
                  No plans available for this product.
                </div>
              )}

              {selectedVariant && activeFields.length > 0 && (
                <div
                  className="mb-4 rounded-xl p-4"
                  style={{
                    border: '1.5px dashed rgba(34, 139, 230, 0.6)',
                    background: 'linear-gradient(135deg, rgba(34,139,230,0.08), rgba(21,170,191,0.08))',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-[#15aabf]" />
                    <h4 className="text-sm font-bold text-foreground">Provide Required Information:</h4>
                  </div>
                  <div className="space-y-3">
                    {activeFields.map((f) => (
                      <InputFieldRenderer
                        key={f.id}
                        field={f}
                        value={fieldValues[f.id]}
                        error={fieldErrors[f.id]}
                        onChange={(v) => {
                          setFieldValues((prev) => ({ ...prev, [f.id]: v }));
                          setFieldErrors((prev) => { const n = { ...prev }; delete n[f.id]; return n; });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isOutOfStock ? (
                <>
                  <Button size="lg" className="w-full" disabled>
                    Out of Stock
                  </Button>
                  <NotifyMe productId={(product as any).id} productName={(product as any).name} />
                </>
              ) : (orderMode === 'whatsapp' || (orderMode === 'cart' && (product as any)?.order_mode === 'whatsapp')) ? (
                <div className="rounded-xl border border-border/40 p-6 flex flex-col items-center text-center gap-4" style={{ backgroundColor: '#0a1e3d' }}>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <h3 className="text-lg font-bold text-foreground">Ready to Order?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please contact us on WhatsApp to talk with the Sales team to place your order.
                  </p>
                  <Button
                    size="lg"
                    className="w-full max-w-[280px] hover:opacity-90 text-white font-semibold text-base py-6 rounded-lg"
                    style={{ backgroundColor: '#25D366' }}
                    disabled={activeVariations.length > 0 && !selectedVariant}
                    onClick={() => {
                      const name = product?.name || '';
                      const price = selectedVariant ? selectedVariant.price : product?.price;
                      const msg = encodeURIComponent(`Hi, I'd like to order:\n${name}\nPrice: NPR ${Number(price).toLocaleString()}`);
                      window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none" className="mr-2"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Click to Message
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full hover:opacity-90"
                    style={{ backgroundColor: '#338fe1' }}
                    onClick={handleAddToCart}
                    disabled={maintenanceMode || (activeVariations.length > 0 && !selectedVariant)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isVariantInCart ? 'Proceed to Payment' : selectedVariant ? `Add to Cart · NPR ${selectedVariant.price}` : 'Add to Cart'}
                  </Button>
                  {maintenanceMode && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-amber-500" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Payment Temporarily Unavailable</h3>
                      <p className="text-sm text-muted-foreground">
                        We're currently performing scheduled maintenance. Please check back later to complete your purchase.
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card>
          );

          return (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              {/* Left Column - Product Info */}
              <div>
                {/* Product Header: Image + Title (toolsmandu.com style) */}
                <div className="flex flex-row gap-4 sm:gap-6 mb-8 items-stretch">
                  <div className="flex-shrink-0">
                    <div className="w-[140px] sm:w-[200px] md:w-[240px] lg:w-[164px]" style={{ aspectRatio: '0.69164265129683' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full rounded-[10px] object-scale-down px-0 mx-0" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-card rounded-[10px]">📦</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      {(product as any).single_product_tag && (
                        <Badge className="bg-primary text-primary-foreground">
                          {(product as any).single_product_tag}
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge className="bg-destructive text-destructive-foreground">Out of Stock</Badge>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground"> {product.name}</h1>
                    <div className="my-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}></div>
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-2">
                      {product.categories && (
                        <Link to={`/item-category/${(product.categories as any).slug}`} className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity min-w-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-[22px] sm:h-[22px] flex-shrink-0" style={{ color: '#7d8aa8' }}><path d="M4 4h6v6h-6z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6h-6z"/><path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/></svg>
                          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white truncate" style={{ background: 'linear-gradient(90deg, #228be6, #22d3ee)' }}>
                            {(product.categories as any).name}
                          </span>
                        </Link>
                      )}
                      {(product as any).region && (
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-[22px] sm:h-[22px] flex-shrink-0" style={{ color: '#7d8aa8' }}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9"/><path d="M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9"/></svg>
                          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white truncate" style={{ background: 'linear-gradient(90deg, #228be6, #22d3ee)' }}>
                            {(product as any).region}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan card on mobile - shown after image */}
                <div className="lg:hidden mb-8">
                  {planCard}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-8 prose prose-sm prose-invert max-w-none text-white [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: product.description.replace(/<a /g, '<a style="color:#16a249" ') }} />
                )}

                {/* FAQ Section */}
                <ProductFAQs productName={product.name} />
              </div>

              {/* Right Sidebar - desktop only */}
              <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
                {planCard}
              </div>
            </div>
          );
        })()}

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Looking for similar items? Check these:</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 165px)' }}>
              {related.map(p => (
                <div key={p.id} className="w-[165px]">
                  <ProductCard {...p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>
    </>
  );
};

export default ProductPage;
