
-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses_per_customer INTEGER NOT NULL DEFAULT 1,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  coupon_scope TEXT NOT NULL DEFAULT 'all_customers' CHECK (coupon_scope IN ('all_customers', 'specific_customer')),
  customer_email TEXT,
  product_scope TEXT NOT NULL DEFAULT 'all_products' CHECK (product_scope IN ('all_products', 'specific_product')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  min_cart_value NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code)
);

-- Create coupon_usages table
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Admins editors manage coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (true);

-- Coupon usages policies
CREATE POLICY "Admins editors manage coupon usages"
ON public.coupon_usages FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Users can view own coupon usage"
ON public.coupon_usages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupon usage"
ON public.coupon_usages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
