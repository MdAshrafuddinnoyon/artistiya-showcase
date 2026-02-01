-- Shop page settings for hero and sales banner
CREATE TABLE IF NOT EXISTS public.shop_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_background_image TEXT,
  hero_title TEXT DEFAULT 'Shop',
  hero_title_bn TEXT,
  hero_subtitle TEXT DEFAULT 'Explore Our Collection',
  hero_subtitle_bn TEXT,
  hero_overlay_opacity DECIMAL DEFAULT 0.5,
  sales_banner_enabled BOOLEAN DEFAULT false,
  sales_banner_image TEXT,
  sales_banner_title TEXT,
  sales_banner_title_bn TEXT,
  sales_banner_link TEXT,
  sales_banner_start_date TIMESTAMP WITH TIME ZONE,
  sales_banner_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop page settings" 
ON public.shop_page_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage shop page settings"
ON public.shop_page_settings
FOR ALL
USING (is_admin(auth.uid()));

INSERT INTO public.shop_page_settings (id) VALUES (gen_random_uuid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_page_settings;