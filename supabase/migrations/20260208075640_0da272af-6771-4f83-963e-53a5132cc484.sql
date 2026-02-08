-- Add customization settings to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS customization_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS advance_payment_percent integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS customization_instructions text;

-- Add customization settings table for global controls
CREATE TABLE IF NOT EXISTS public.customization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_order_enabled boolean DEFAULT true,
  header_button_enabled boolean DEFAULT true,
  default_advance_percent integer DEFAULT 50,
  min_advance_percent integer DEFAULT 20,
  max_advance_percent integer DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

-- Policies for customization_settings
CREATE POLICY "Customization settings are viewable by everyone"
ON public.customization_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can update customization settings"
ON public.customization_settings FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert customization settings"
ON public.customization_settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Insert default settings if not exists
INSERT INTO public.customization_settings (id, custom_order_enabled, header_button_enabled, default_advance_percent)
SELECT gen_random_uuid(), true, true, 50
WHERE NOT EXISTS (SELECT 1 FROM public.customization_settings LIMIT 1);

-- Enhance custom_order_requests table for product-specific orders
ALTER TABLE public.custom_order_requests
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_transaction_id text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS division text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS thana text,
ADD COLUMN IF NOT EXISTS address_line text,
ADD COLUMN IF NOT EXISTS delivery_notes text;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_customization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_customization_settings_updated_at ON public.customization_settings;
CREATE TRIGGER update_customization_settings_updated_at
BEFORE UPDATE ON public.customization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_customization_settings_updated_at();