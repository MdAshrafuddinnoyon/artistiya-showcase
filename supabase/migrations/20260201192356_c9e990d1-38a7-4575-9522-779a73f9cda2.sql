-- Add new fields to site_branding table for enhanced functionality
ALTER TABLE public.site_branding 
ADD COLUMN IF NOT EXISTS show_logo_text boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_logo_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS footer_banner_url text,
ADD COLUMN IF NOT EXISTS footer_banner_link text,
ADD COLUMN IF NOT EXISTS footer_banner_height integer DEFAULT 80,
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '["bKash", "Nagad", "Visa", "Mastercard", "COD"]'::jsonb,
ADD COLUMN IF NOT EXISTS signup_discount_percent numeric DEFAULT 5,
ADD COLUMN IF NOT EXISTS signup_discount_enabled boolean DEFAULT true;

-- Create social_links table for multiple social media links
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on social_links
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for social_links (admin only for write, public for read)
CREATE POLICY "Anyone can view active social links"
ON public.social_links FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage social links"
ON public.social_links FOR ALL
USING (public.is_admin(auth.uid()));

-- Insert default social links
INSERT INTO public.social_links (platform, url, icon_name, display_order)
VALUES 
  ('facebook', 'https://facebook.com', 'facebook', 1),
  ('instagram', 'https://instagram.com', 'instagram', 2),
  ('twitter', 'https://twitter.com', 'twitter', 3),
  ('youtube', 'https://youtube.com', 'youtube', 4),
  ('tiktok', 'https://tiktok.com', 'music', 5),
  ('linkedin', 'https://linkedin.com', 'linkedin', 6),
  ('whatsapp', 'https://wa.me/', 'message-circle', 7),
  ('pinterest', 'https://pinterest.com', 'pin', 8)
ON CONFLICT DO NOTHING;

-- Add category_id to bundle_products for smart bundle suggestions
ALTER TABLE public.bundle_products 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- Create trigger for updated_at on social_links
CREATE OR REPLACE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();