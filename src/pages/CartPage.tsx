import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const CartPage = () => {
  const { items, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    setPlacing(true);
    try {
      const websiteUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('khalti-initiate', {
        body: {
          items: items.map(item => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
            variantId: item.variantId,
            variantName: item.variantName,
          })),
          return_url: `${websiteUrl}/payment/verify`,
          website_url: websiteUrl,
        },
      });

      if (error || !data?.payment_url) {
        toast.error('Failed to initiate payment. Please try again.');
        console.error('Khalti initiation error:', error, data);
        setPlacing(false);
        return;
      }

      // Clear cart before redirecting
      clearCart();
      // Redirect to Khalti payment page
      window.location.href = data.payment_url;
    } catch {
      toast.error('Failed to initiate payment');
      setPlacing(false);
    }
  };

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
      <p className="text-muted-foreground mb-6">Start adding some products!</p>
      <Button asChild><Link to="/">Browse Products</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart ({itemCount} items)</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="h-16 w-16 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-contain" /> : <span>📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                {item.duration && !item.variantName && <p className="text-xs text-muted-foreground">{item.duration}</p>}
                <p className="font-bold text-foreground mt-1">NPR {item.price}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, item.variantId)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-20">
          <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>NPR {total.toFixed(2)}</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground"><span>Total</span><span>NPR {total.toFixed(2)}</span></div>
          </div>
          <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? 'Redirecting to Khalti...' : 'Pay with Khalti'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">You will be redirected to Khalti to complete payment</p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
