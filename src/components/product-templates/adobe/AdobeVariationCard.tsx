import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Variation {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  stock_status?: string;
  sort_order?: number;
}

interface Product {
  id: string;
  name: string;
  image_url?: string | null;
  duration?: string | null;
  price: number;
  stock_status?: string;
  product_variations?: Variation[];
}

const AdobeVariationCard = ({ product }: { product: Product }) => {
  const { addItem, items } = useCart();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<Variation | null>(null);

  const isOutOfStock = product.stock_status === 'out_of_stock';
  const activeVariations = (product.product_variations || [])
    .filter((v) => v.is_active && v.stock_status !== 'out_of_stock')
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.variationId) return;
      const match = activeVariations.find((v) => v.id === detail.variationId);
      if (match) setSelectedVariant(match);
    };
    window.addEventListener('adobe:select-variation', handler);
    return () => window.removeEventListener('adobe:select-variation', handler);
  }, [activeVariations]);

  const isVariantInCart = selectedVariant
    ? items.some((i) => i.id === product.id && i.variantId === selectedVariant.id)
    : items.some((i) => i.id === product.id && !i.variantId);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (isVariantInCart) {
      navigate('/cart');
      return;
    }
    if (activeVariations.length > 0 && !selectedVariant) {
      toast.error('Please select a plan');
      return;
    }
    if (selectedVariant) {
      addItem({
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image_url: product.image_url ?? null,
        duration: product.duration ?? null,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
      });
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url ?? null,
        duration: product.duration ?? null,
      });
    }
  };

  return (
    <Card className="p-6" style={{ backgroundColor: '#0a2e5c' }}>
      <h3 className="font-bold text-foreground text-lg mb-4">Select a Plan</h3>

      {activeVariations.length > 0 ? (
        <div className="space-y-3 mb-4">
          {activeVariations.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                disabled={isOutOfStock}
                className={cn(
                  'w-full text-left flex items-center gap-4 p-4 border-2 rounded-xl transition-all',
                  isSelected
                    ? 'bg-[#228be6]/10 border-[#228be6] ring-1 ring-[#15aabf]'
                    : 'bg-white/5 border-white/10 hover:border-[#228be6]/50 hover:bg-white/10',
                  isOutOfStock && 'opacity-50 cursor-not-allowed'
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
                  <div className="font-semibold text-sm" style={{ color: '#16a249' }}>
                    NPR {v.price}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    !isSelected && 'bg-white/10'
                  )}
                  style={isSelected ? { background: 'linear-gradient(90deg, #228be6, #15aabf)' } : undefined}
                >
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

      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        style={{ background: 'linear-gradient(90deg, #228be6, #15aabf)' }}
      >
        {isOutOfStock ? 'Out of Stock' : isVariantInCart ? 'Go to Cart' : 'Add to Cart'}
      </Button>
    </Card>
  );
};

export default AdobeVariationCard;
