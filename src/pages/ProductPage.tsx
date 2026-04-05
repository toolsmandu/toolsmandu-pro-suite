import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Check } from 'lucide-react';
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link to={`/category/${(product.categories as any).slug}`} className="hover:text-foreground">
                {(product.categories as any).name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

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
              <div className="flex-1">
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
                <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
                {product.categories && (
                  <Badge variant="secondary" className="mb-3">
                    {(product.categories as any).name}
                  </Badge>
                )}
                {product.duration && (
                  <p className="text-muted-foreground">
                    Product type: <span className="text-foreground font-medium">{product.duration}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-3 text-lg">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-3 text-lg">Features</h3>
                <ul className="space-y-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Sidebar - Select a Plan */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="p-6" style={{ backgroundColor: '#0a2e5c' }}>
              <h3 className="font-bold text-foreground text-lg mb-4">
                Select a Plan
              </h3>

              {activeVariations.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {activeVariations.map((v: any) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const discount = v.original_price && v.original_price > v.price
                      ? Math.round(((v.original_price - v.price) / v.original_price) * 100)
                      : 0;

                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        disabled={isOutOfStock}
                        className={cn(
                          "w-full border rounded-lg p-3 text-left transition-all flex items-center gap-3",
                          isSelected
                            ? "border-[#f97015] ring-1 ring-[#f97015]"
                            : "border-border hover:border-[#f97015]/50",
                          isOutOfStock && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {/* Small product thumbnail */}
                        <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm">{v.name}</div>
                          {v.variation_info && (
                            <div className="text-xs text-muted-foreground">{v.variation_info}</div>
                          )}
                          <div className="font-semibold text-sm mt-1" style={{ color: '#f97015' }}>NPR {v.price}</div>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f97015' }}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <ShoppingCart className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
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
