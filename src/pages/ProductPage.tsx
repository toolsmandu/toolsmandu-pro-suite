import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Check, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

const ProductPage = () => {
  const { slug } = useParams();
  const { addItem } = useCart();

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
    .filter((v: any) => v.is_active)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [orderMode, setOrderMode] = useState('cart');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bannerImage, setBannerImage] = useState('');

  useQuery({
    queryKey: ['order-mode-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', ['order_mode', 'whatsapp_number', 'product_banner_image']);
      data?.forEach((s: any) => {
        if (s.key === 'order_mode') setOrderMode(s.value);
        if (s.key === 'whatsapp_number') setWhatsappNumber(s.value);
        if (s.key === 'product_banner_image') setBannerImage(s.value);
      });
      return data;
    },
  });

  useEffect(() => {
    if (activeVariations.length > 0 && !selectedVariant) {
      setSelectedVariant(activeVariations[0]);
    }
  }, [activeVariations, selectedVariant]);

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

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (selectedVariant) {
      addItem({
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image_url: product.image_url,
        duration: product.duration,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        duration: product.duration,
      });
    }
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          <div className="h-60 bg-card rounded-lg animate-pulse" />
          <div className="h-8 bg-card rounded w-3/4 animate-pulse" />
        </div>
        <div className="h-96 bg-card rounded-lg animate-pulse" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
      <Button asChild><Link to="/">Back to Home</Link></Button>
    </div>
  );

  return (
    <>
      {product.meta_title && <title>{product.meta_title}</title>}
      <div className="container mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left Column - Product Info */}
          <div>
            {/* Product Header: Image + Title */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-full md:w-60 flex-shrink-0">
                <div className="aspect-square bg-card border border-border rounded-lg overflow-hidden flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">📦</div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  {product.is_flash_sale && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      {product.flash_sale_label || '🔥 Sale'}
                    </Badge>
                  )}
                  {product.is_bestseller && (
                    <Badge className="bg-warning text-warning-foreground">⭐ Bestseller</Badge>
                  )}
                  {isOutOfStock && (
                    <Badge className="bg-destructive text-destructive-foreground">Out of Stock</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">{product.name}</h1>
                <div className="border-t mb-3" style={{ borderColor: 'white' }}></div>
                <div className="flex items-center gap-2">
                  {product.categories && (
                    <Badge className="flex items-center gap-1" style={{ background: 'linear-gradient(90deg, #228be6, #15aabf)', color: 'white', border: 'none' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h6v6h-6z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6h-6z"/><path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/></svg>
                      {(product.categories as any).name}
                    </Badge>
                  )}
                  {(product as any).region && (
                    <Badge className="flex items-center gap-1" style={{ background: 'linear-gradient(90deg, #228be6, #15aabf)', color: 'white', border: 'none' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9"/><path d="M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9"/></svg>
                      Region: {(product as any).region}
                    </Badge>
                  )}
                  <Badge className="flex items-center gap-1" style={{ background: 'linear-gradient(90deg, #228be6, #15aabf)', color: 'white', border: 'none' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    Warranty & Support Included
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8 prose prose-sm prose-invert max-w-none text-white [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: product.description.replace(/<a /g, '<a style="color:#f97015" ') }} />
            )}
          </div>

          {/* Right Sidebar - Select a Plan */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="p-6" style={{ backgroundColor: '#0a2e5c' }}>
              <h3 className="font-bold text-foreground text-lg mb-4">
                Select a Plan
              </h3>

              {activeVariations.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {activeVariations.map((v: any) => {
                    const isSelected = selectedVariant?.id === v.id;

                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        disabled={isOutOfStock}
                        className={cn(
                          "w-full border-2 rounded-xl p-4 text-left transition-all flex items-center gap-4",
                          isSelected
                            ? "bg-[#f97015]/10 border-[#f97015] ring-1 ring-[#f97015]"
                            : "bg-white/5 border-white/10 hover:border-[#f97015]/50 hover:bg-white/10",
                          isOutOfStock && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {/* Small product thumbnail */}
                        <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-semibold text-foreground text-sm">{v.name}</div>
                          {v.variation_info && (
                            <div className="text-xs text-muted-foreground">{v.variation_info}</div>
                          )}
                          <div className="font-semibold text-sm" style={{ color: '#f97015' }}>NPR {v.price}</div>
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm mb-4">
                  No plans available for this product.
                </div>
              )}

              {isOutOfStock ? (
                <Button size="lg" className="w-full" disabled>
                  Out of Stock
                </Button>
              ) : (orderMode === 'whatsapp' || (orderMode === 'cart' && (product as any)?.order_mode === 'whatsapp')) ? (
                <Button
                  size="lg"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: 'hsl(142, 70%, 45%)' }}
                  disabled={activeVariations.length > 0 && !selectedVariant}
                  onClick={() => {
                    const name = product?.name || '';
                    const price = selectedVariant ? selectedVariant.price : product?.price;
                    const msg = encodeURIComponent(`Hi, I'd like to order:\n${name}\nPrice: NPR ${Number(price).toLocaleString()}`);
                    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Order via WhatsApp
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full hover:opacity-90"
                  style={{ backgroundColor: '#f97015' }}
                  onClick={handleAddToCart}
                  disabled={activeVariations.length > 0 && !selectedVariant}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                  {selectedVariant && <span className="ml-1">· NPR {selectedVariant.price}</span>}
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductPage;
