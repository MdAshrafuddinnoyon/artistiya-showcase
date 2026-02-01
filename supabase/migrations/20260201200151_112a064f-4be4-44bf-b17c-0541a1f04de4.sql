
-- Product Reviews System (Order Verification Required)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  reviewer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can create reviews for their orders"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Guest Checkout & Fraud Settings Table
CREATE TABLE IF NOT EXISTS public.checkout_fraud_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_checkout_enabled BOOLEAN DEFAULT true,
  order_rate_limit_seconds INTEGER DEFAULT 60,
  max_orders_per_phone_24h INTEGER DEFAULT 5,
  max_cod_amount_new_customer NUMERIC DEFAULT 20000,
  block_suspicious_orders BOOLEAN DEFAULT true,
  require_captcha_for_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_fraud_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read checkout fraud settings"
ON public.checkout_fraud_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can update checkout fraud settings"
ON public.checkout_fraud_settings FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.checkout_fraud_settings (
  guest_checkout_enabled,
  order_rate_limit_seconds,
  max_orders_per_phone_24h,
  max_cod_amount_new_customer,
  block_suspicious_orders,
  require_captcha_for_guest
) VALUES (true, 60, 5, 20000, true, false)
ON CONFLICT DO NOTHING;

-- Blocked Customers Table
CREATE TABLE IF NOT EXISTS public.blocked_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT,
  email TEXT,
  ip_address TEXT,
  user_id UUID,
  block_reason TEXT NOT NULL,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unblocked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT blocked_customer_identifier CHECK (
    phone IS NOT NULL OR email IS NOT NULL OR ip_address IS NOT NULL OR user_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.blocked_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Only admins can manage blocked customers"
ON public.blocked_customers FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Google Reviews Settings (add to site_branding or create new table)
ALTER TABLE public.site_branding 
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS google_api_key TEXT,
ADD COLUMN IF NOT EXISTS auto_sync_google_reviews BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_manual_reviews_when_api_active BOOLEAN DEFAULT false;

-- Add triggers
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkout_fraud_settings_updated_at
BEFORE UPDATE ON public.checkout_fraud_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_customers;
