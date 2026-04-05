import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
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
    const { data: order, error } = await supabase.from('orders').insert({ user_id: user.id, total, status: 'processing' as const }).select().single();
    if (error || !order) {
      toast.error('Failed to place order');
      setPlacing(false);
      return;
    }
    const orderItems = items.map(i => ({ order_id: order.id, product_id: i.id, price: i.price, quantity: i.quantity }));
    await supabase.from('order_items').insert(orderItems);
    clearCart();
    toast.success('Order placed successfully!');
    navigate('/dashboard/orders');
    setPlacing(false);
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-8 text-center text-foreground">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
            {placing ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
