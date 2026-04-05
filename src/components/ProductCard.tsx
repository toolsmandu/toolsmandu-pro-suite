import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

interface Variation {
  id: string;
  price: number;
  original_price?: number | null;
  is_active: boolean;
}

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  duration?: string | null;
  rating?: number | null;
  is_flash_sale?: boolean | null;
  flash_sale_label?: string | null;
  is_bestseller?: boolean | null;
  stock_status?: string | null;
  product_variations?: Variation[] | null;
}

const ProductCard = ({ id, name, slug, price, original_price, image_url, duration, is_flash_sale, flash_sale_label, stock_status, product_variations }: ProductCardProps) => {
  const { addItem } = useCart();
  const isOutOfStock = stock_status === 'out_of_stock';

  // Compute lowest price from active variations, fallback to product price
  const activeVariations = (product_variations as any[])?.filter((v: any) => v.is_active) || [];
  const lowestVariationPrice = activeVariations.length > 0
    ? Math.min(...activeVariations.map((v: any) => Number(v.price)))
    : null;
  const displayPrice = lowestVariationPrice ?? price;
  const displayOriginal = activeVariations.length > 0
    ? Math.max(...activeVariations.filter((v: any) => v.original_price).map((v: any) => Number(v.original_price)), 0) || null
    : original_price;

  const discount = displayOriginal && displayOriginal > displayPrice
    ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)
    : 0;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
      <Link to={`/product/${slug}`} className="block relative overflow-hidden">
        <div className="aspect-square bg-secondary flex items-center justify-center">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="text-4xl text-muted-foreground">📦</div>
          )}
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && <Badge className="bg-destructive text-destructive-foreground text-xs">Out of Stock</Badge>}
          {!isOutOfStock && is_flash_sale && <Badge className="bg-destructive text-destructive-foreground text-xs">{flash_sale_label || '🔥 Sale'}</Badge>}
          {!isOutOfStock && discount > 0 && <Badge className="bg-success text-success-foreground text-xs">-{discount}%</Badge>}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/product/${slug}`}>
          <h3 className="font-medium text-foreground text-sm line-clamp-2 hover:text-primary transition-colors">{name}</h3>
        </Link>
        {duration && <p className="text-xs text-muted-foreground mt-1">{duration}</p>}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">NPR {displayPrice}</span>
            {displayOriginal && displayOriginal > displayPrice && (
              <span className="text-sm text-muted-foreground line-through ml-2">NPR {displayOriginal}</span>
            )}
          </div>
          {isOutOfStock ? (
            <Button size="icon" variant="secondary" className="h-8 w-8 opacity-50" disabled aria-label="Out of stock">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e) => { e.preventDefault(); addItem({ id, name, price: displayPrice, image_url, duration }); }}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
