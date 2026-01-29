-- Create theme_settings table for colors, fonts customization
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Theme settings are public" 
ON public.theme_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage theme settings" 
ON public.theme_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Insert default theme settings
INSERT INTO public.theme_settings (setting_key, setting_value) VALUES
('colors', '{"primary": "#d4af37", "primaryLight": "#e5c158", "background": "#0a0a0a", "foreground": "#ffffff", "card": "#1a1a1a", "muted": "#262626", "border": "#333333", "accent": "#c4a035"}'),
('fonts', '{"display": "Playfair Display", "body": "Lato", "bengali": "Hind Siliguri"}'),
('layout', '{"containerWidth": "1280px", "borderRadius": "8px", "headerHeight": "80px"}')
ON CONFLICT (setting_key) DO NOTHING;

-- Create homepage_sections table for dynamic section management
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'products', 'category', 'banner', 'custom'
  title TEXT NOT NULL,
  subtitle TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}', -- stores category_id, product_ids, layout options
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Homepage sections are public" 
ON public.homepage_sections FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage homepage sections" 
ON public.homepage_sections FOR ALL USING (public.is_admin(auth.uid()));

-- Add mega_menu columns to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS banner_title TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS banner_subtitle TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS banner_link TEXT;

-- Create menu_sub_items for mega menu structure
CREATE TABLE IF NOT EXISTS public.menu_sub_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  image_url TEXT,
  items TEXT[], -- array of sub-sub items
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_sub_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Menu sub items are public" 
ON public.menu_sub_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu sub items" 
ON public.menu_sub_items FOR ALL USING (public.is_admin(auth.uid()));

-- Add image_url to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add featured section support to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_section TEXT; -- 'new_arrivals', 'best_sellers', 'trending'

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER update_homepage_sections_updated_at
BEFORE UPDATE ON public.homepage_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();