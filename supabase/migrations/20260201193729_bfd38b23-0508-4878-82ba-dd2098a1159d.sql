-- Add QR code and discount tracking for orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS qr_code_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS qr_discount_claimed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS qr_discount_claimed_at timestamp with time zone;

-- Create QR code discount settings table
CREATE TABLE IF NOT EXISTS public.qr_discount_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active boolean DEFAULT true,
  discount_percent numeric(5,2) DEFAULT 5,
  discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) DEFAULT 5,
  min_order_value numeric(10,2) DEFAULT 0,
  expires_after_days integer DEFAULT 30,
  usage_limit_per_customer integer DEFAULT 1,
  message text DEFAULT 'Thank you for scanning! Enjoy a special discount on your next order.',
  message_bn text DEFAULT 'স্ক্যান করার জন্য ধন্যবাদ! আপনার পরবর্তী অর্ডারে বিশেষ ছাড় উপভোগ করুন।',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qr_discount_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for qr_discount_settings
CREATE POLICY "Anyone can read QR discount settings" ON public.qr_discount_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage QR discount settings" ON public.qr_discount_settings
FOR ALL USING (public.is_admin(auth.uid()));

-- Create customer discount credits table
CREATE TABLE IF NOT EXISTS public.customer_discount_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_type text DEFAULT 'percentage',
  discount_value numeric(10,2) NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamp with time zone,
  used_on_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  expires_at timestamp with time zone,
  source text DEFAULT 'qr_scan',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_discount_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_discount_credits
CREATE POLICY "Users can view their own credits" ON public.customer_discount_credits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credits" ON public.customer_discount_credits
FOR ALL USING (public.is_admin(auth.uid()));

-- Create delivery partner tracking table
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_phone text,
  contact_email text,
  api_type text,
  api_key text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery partners" ON public.delivery_partners
FOR ALL USING (public.is_admin(auth.uid()));

-- Add delivery tracking to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_partner_id uuid REFERENCES public.delivery_partners(id),
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS return_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS return_reason text,
ADD COLUMN IF NOT EXISTS partner_payment_status text DEFAULT 'pending' CHECK (partner_payment_status IN ('pending', 'received', 'disputed')),
ADD COLUMN IF NOT EXISTS partner_payment_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS partner_payment_date timestamp with time zone;

-- Create CRM reports table to store generated reports
CREATE TABLE IF NOT EXISTS public.crm_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  data jsonb,
  generated_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM reports" ON public.crm_reports
FOR ALL USING (public.is_admin(auth.uid()));

-- Add category-based bundle trigger
ALTER TABLE public.upsell_offers 
ADD COLUMN IF NOT EXISTS trigger_categories text[];

-- Add trigger types for bundles
ALTER TABLE public.product_bundles 
ADD COLUMN IF NOT EXISTS trigger_category_id uuid REFERENCES public.categories(id);

-- Insert default QR discount settings
INSERT INTO public.qr_discount_settings (discount_percent, discount_type, discount_value, is_active)
VALUES (5, 'percentage', 5, true)
ON CONFLICT DO NOTHING;