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
  const activeVariations = (product_variations as any[])?.filter((v: any) => v.is_active && v.stock_status !== 'out_of_stock') || [];
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
    <div className="group flex flex-col rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a2e5c' }}>
      <Link to={`/item/${slug}`} className="block relative">
        <div className="relative w-full aspect-[2/3] overflow-hidden">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              loading="lazy"
              className="absolute inset-0 w-full h-full scale-105 group-hover:scale-110 transition-transform duration-300 object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center w-full h-full text-4xl text-muted-foreground">📦</div>
          )}
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && <Badge className="bg-destructive text-destructive-foreground text-xs">Out of Stock</Badge>}
          {!isOutOfStock && flash_sale_label && <Badge className="bg-destructive text-destructive-foreground text-xs">{flash_sale_label}</Badge>}
          {!isOutOfStock && !flash_sale_label && discount > 0 && <Badge className="bg-success text-success-foreground text-xs">-{discount}%</Badge>}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col text-center relative" style={{ backgroundColor: '#0a2e5c' }}>
        <Link to={`/item/${slug}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors" style={{ fontSize: '12px' }}>{name}</h3>
        </Link>
        
        <div className="mt-2">
          <span className="font-bold" style={{ color: '#f5b800', fontSize: '22px' }}>Rs {displayPrice}</span>
        </div>
        {!isOutOfStock && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 absolute bottom-3 right-3"
            onClick={(e) => { e.preventDefault(); addItem({ id, name, price: displayPrice, image_url, duration }); }}
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
        {isOutOfStock && (
          <Button size="icon" variant="secondary" className="h-8 w-8 absolute bottom-3 right-3 opacity-50" disabled aria-label="Out of stock">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  );
};

export default ProductCard;
