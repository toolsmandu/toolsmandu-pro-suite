import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  discountAmount: number;
}

const CartPage = () => {
  const { items, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'khalti' | 'nps'>('khalti');
  const [npsEnabled, setNpsEnabled] = useState(false);
  const [npsSandbox, setNpsSandbox] = useState(false);

  // Reset placing state when user navigates back from payment page
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPlacing(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    setPlacing(false);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Load NPS enabled flag
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'nps_enabled')
      .maybeSingle()
      .then(({ data }) => setNpsEnabled(data?.value === 'true'));
  }, []);

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) { toast.error('Please login to apply a coupon'); return; }

    setApplying(true);
    try {
      const code = couponCode.trim().toUpperCase();

      // Fetch coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) { toast.error('Coupon code is wrong.'); setApplying(false); return; }

      // Check expiry
      if (new Date(coupon.expiry_date) < new Date()) {
        toast.error('Coupon code is Expired.'); setApplying(false); return;
      }

      // Check per-user usage
      const { count } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id);

      if ((count || 0) >= coupon.max_uses_per_customer) {
        toast.error('You have already used this Coupon.'); setApplying(false); return;
      }

      // Check total usage
      const { count: totalUsed } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);

      if ((totalUsed || 0) >= coupon.total_quantity) {
        toast.error('This coupon has reached its usage limit.'); setApplying(false); return;
      }

      // Check customer-specific
      if (coupon.coupon_scope === 'specific_customer') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();
        if (profile?.email !== coupon.customer_email) {
          toast.error('This coupon is assigned for another customer. You are not allowed to redeem.');
          setApplying(false); return;
        }
      }

      // Check product-specific
      if (coupon.product_scope === 'specific_product' && coupon.product_id) {
        const cartProductIds = items.map(i => i.id);
        const cartVariantIds = items.map(i => i.variantId).filter(Boolean);
        const productMatch = cartProductIds.includes(coupon.product_id);
        const variantMatch = !coupon.variation_id || cartVariantIds.includes(coupon.variation_id);
        if (!productMatch || !variantMatch) {
          toast.error("This coupon can't be applied to the products in your cart. Please contact Support team.");
          setApplying(false); return;
        }
      }

      // Check min cart value
      if (coupon.min_cart_value && total < Number(coupon.min_cart_value)) {
        toast.error(`Your total order amount must be at least NPR ${Number(coupon.min_cart_value).toFixed(2)} to use this coupon.`);
        setApplying(false); return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (total * Number(coupon.discount_value)) / 100;
        if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
          discountAmount = Number(coupon.max_discount_amount);
          toast.info(`This coupon allows you to get discount upto NPR ${Number(coupon.max_discount_amount).toFixed(2)}.`);
        }
      } else {
        discountAmount = Number(coupon.discount_value);
      }
      if (discountAmount > total) discountAmount = total;

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
        discountAmount,
      });
      toast.success('Coupon applied successfully!');
    } catch {
      toast.error('Failed to apply coupon');
    }
    setApplying(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); };
  const finalTotal = appliedCoupon ? total - appliedCoupon.discountAmount : total;

  const handlePlaceOrder = async () => {
    if (!user) { toast.error('Please login to place an order'); navigate('/login'); return; }
    setPlacing(true);
    try {
      const websiteUrl = window.location.origin;

      if (paymentMethod === 'nps') {
        const { data, error } = await supabase.functions.invoke('nps-initiate', {
          body: {
            items: items.map(item => ({
              id: item.id, price: item.price, quantity: item.quantity,
              variantId: item.variantId, variantName: item.variantName,
              inputFieldResponses: item.inputFieldResponses || [],
            })),
            coupon_id: appliedCoupon?.id || null,
            discount_amount: appliedCoupon?.discountAmount || 0,
            return_url: `${websiteUrl}/payment/verify?gw=nps`,
            website_url: websiteUrl,
            mode: npsSandbox ? 'sandbox' : 'production',
          },
        });

        if (error || !data?.gateway_url || !data?.fields) {
          toast.error('Failed to initiate Nepal Payment Solution. Please try again.');
          setPlacing(false); return;
        }

        // Auto-submit hidden form to OnePG gateway
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.gateway_url;
        Object.entries(data.fields).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = String(v ?? '');
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      const { data, error } = await supabase.functions.invoke('khalti-initiate', {
        body: {
          items: items.map(item => ({
            id: item.id, price: item.price, quantity: item.quantity,
            variantId: item.variantId, variantName: item.variantName,
            inputFieldResponses: item.inputFieldResponses || [],
          })),
          coupon_id: appliedCoupon?.id || null,
          discount_amount: appliedCoupon?.discountAmount || 0,
          return_url: `${websiteUrl}/payment/verify`,
          website_url: websiteUrl,
        },
      });

      if (error || !data?.payment_url) {
        toast.error('Failed to initiate payment. Please try again.');
        setPlacing(false); return;
      }
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
        <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-20 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

          {/* Coupon section */}
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-success" />
                <span className="font-mono text-sm font-medium text-success">{appliedCoupon.code}</span>
                <span className="text-xs text-muted-foreground">(-NPR {appliedCoupon.discountAmount.toFixed(2)})</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeCoupon}><X className="h-3 w-3" /></Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="font-mono" onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
              <Button variant="outline" onClick={applyCoupon} disabled={applying}>{applying ? '...' : 'Apply'}</Button>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>NPR {total.toFixed(2)}</span></div>
            {appliedCoupon && (
              <div className="flex justify-between text-success"><span>Discount</span><span>-NPR {appliedCoupon.discountAmount.toFixed(2)}</span></div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground"><span>Total</span><span>NPR {finalTotal.toFixed(2)}</span></div>
          </div>

          {npsEnabled && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Payment Method</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('khalti')}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${paymentMethod === 'khalti' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  Khalti
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nps')}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${paymentMethod === 'nps' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  Nepal Payment Solution
                </button>
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placing}>
            {placing
              ? (paymentMethod === 'nps' ? 'Redirecting to Nepal Payment Solution...' : 'Redirecting to Khalti...')
              : (paymentMethod === 'nps' ? 'Pay with Nepal Payment Solution' : 'Pay with Khalti')}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {paymentMethod === 'nps'
              ? 'You will be redirected to Nepal Payment Solution to complete payment'
              : 'You will be redirected to Khalti to complete payment'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
