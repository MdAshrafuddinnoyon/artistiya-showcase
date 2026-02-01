-- Add showcase products feature (display-only products for custom orders)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_showcase boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS showcase_description text,
ADD COLUMN IF NOT EXISTS showcase_description_bn text;

-- Add index for showcase products
CREATE INDEX IF NOT EXISTS idx_products_showcase ON public.products(is_showcase) WHERE is_showcase = true;

-- Enable realtime for categories and collections
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_order_requests;

-- Add price range settings for shop page
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_price numeric DEFAULT 0,
  max_price numeric DEFAULT 50000,
  price_step numeric DEFAULT 100,
  default_sort text DEFAULT 'newest',
  products_per_page integer DEFAULT 12,
  show_out_of_stock boolean DEFAULT true,
  show_showcase_products boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO public.shop_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS on shop_settings
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shop settings" ON public.shop_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can update shop settings" ON public.shop_settings
FOR UPDATE USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();