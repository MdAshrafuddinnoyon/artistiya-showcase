-- Create storage bucket for media files
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update media files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete media files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

-- Content pages table for About, Terms, Privacy, etc.
CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_bn TEXT,
  content TEXT NOT NULL DEFAULT '',
  content_bn TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_pages
CREATE POLICY "Anyone can view active content pages" 
ON public.content_pages FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage content pages" 
ON public.content_pages FOR ALL 
USING (public.is_admin(auth.uid()));

-- Insert default content pages
INSERT INTO public.content_pages (page_key, title, content) VALUES
  ('about', 'About Us', '<h1>About Artistiya</h1><p>Write your about content here...</p>'),
  ('terms', 'Terms & Conditions', '<h1>Terms & Conditions</h1><p>Write your terms content here...</p>'),
  ('privacy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Write your privacy policy content here...</p>'),
  ('return-policy', 'Return Policy', '<h1>Return Policy</h1><p>Write your return policy content here...</p>'),
  ('shipping-info', 'Shipping Information', '<h1>Shipping Information</h1><p>Write your shipping info content here...</p>')
ON CONFLICT (page_key) DO NOTHING;

-- Instagram posts table for manual uploads
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instagram posts" 
ON public.instagram_posts FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage instagram posts" 
ON public.instagram_posts FOR ALL 
USING (public.is_admin(auth.uid()));

-- Product bundles/upsells table for checkout
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bundles" 
ON public.product_bundles FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage bundles" 
ON public.product_bundles FOR ALL 
USING (public.is_admin(auth.uid()));

-- Bundle products relation
CREATE TABLE IF NOT EXISTS public.bundle_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bundle products" 
ON public.bundle_products FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage bundle products" 
ON public.bundle_products FOR ALL 
USING (public.is_admin(auth.uid()));

-- Upsell offers for checkout
CREATE TABLE IF NOT EXISTS public.upsell_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent INTEGER DEFAULT 15,
  trigger_type TEXT DEFAULT 'cart_value', -- 'cart_value', 'product', 'category'
  trigger_value TEXT, -- JSON with conditions
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.upsell_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active upsell offers" 
ON public.upsell_offers FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage upsell offers" 
ON public.upsell_offers FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add new_arrivals and featured section settings to homepage_content
INSERT INTO public.homepage_content (section_key, content, display_order, is_active) VALUES
  ('new_arrivals', '{"title": "New Arrivals", "subtitle": "Fresh Creations", "showCount": 8}', 3, true),
  ('instagram', '{"title": "@artistiya.store", "showCount": 6}', 7, true),
  ('youtube', '{"title": "Watch Our Story", "subtitle": "Behind the Scenes", "showCount": 4}', 8, true)
ON CONFLICT (section_key) DO NOTHING;

-- Update hero_slides to add more fields for advanced slider
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS overlay_opacity INTEGER DEFAULT 40;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS text_alignment TEXT DEFAULT 'left';
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS animation_type TEXT DEFAULT 'fade';

-- Trigger for content_pages updated_at
CREATE OR REPLACE TRIGGER update_content_pages_updated_at
BEFORE UPDATE ON public.content_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();