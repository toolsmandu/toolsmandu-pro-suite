import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

const ProductPage = () => {
  const { slug } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, product_variations(*)').eq('category_id', product!.category_id!).neq('id', product!.id).limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-card rounded-lg animate-pulse" />
        <div className="space-y-4"><div className="h-8 bg-card rounded w-3/4 animate-pulse" /><div className="h-4 bg-card rounded w-1/2 animate-pulse" /></div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
      <Button asChild><Link to="/">Back to Home</Link></Button>
    </div>
  );

  const features = (product.features as string[] | null) || [];
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

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
              <Link to={`/category/${(product.categories as any).slug}`} className="hover:text-foreground">{(product.categories as any).name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-card border border-border rounded-lg flex items-center justify-center p-8">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-6xl">📦</div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.is_flash_sale && <Badge className="bg-destructive text-destructive-foreground">{product.flash_sale_label || '🔥 Sale'}</Badge>}
              {product.is_bestseller && <Badge className="bg-warning text-warning-foreground">⭐ Bestseller</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-warning text-warning" />
                <span className="text-muted-foreground">{product.rating}/5</span>
              </div>
            )}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-bold text-foreground">NPR {product.price}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">NPR {product.original_price}</span>
                  <Badge className="bg-success text-success-foreground">Save {discount}%</Badge>
                </>
              )}
            </div>
            {product.duration && (
              <p className="text-muted-foreground mb-6">Duration: <span className="text-foreground font-medium">{product.duration}</span></p>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Features</h3>
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

            <div className="flex gap-3">
              {(product as any).stock_status === 'out_of_stock' ? (
                <Button size="lg" className="flex-1" disabled>
                  Out of Stock
                </Button>
              ) : (
                <Button size="lg" className="flex-1" onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, duration: product.duration })}>
                  <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                </Button>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="font-semibold text-foreground mb-3">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
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
