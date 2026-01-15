-- Hero Slides Table
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  title_highlight TEXT,
  title_end TEXT,
  badge_text TEXT,
  description TEXT,
  button_text TEXT DEFAULT 'Shop Now',
  button_link TEXT DEFAULT '/shop',
  secondary_button_text TEXT,
  secondary_button_link TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Category Display Settings Table
CREATE TABLE public.category_display_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_title TEXT DEFAULT 'Shop by Category',
  section_subtitle TEXT DEFAULT 'Explore Our World',
  items_to_show INTEGER DEFAULT 4,
  card_shape TEXT DEFAULT 'square', -- square, rounded, circle
  enable_slider BOOLEAN DEFAULT false,
  auto_slide BOOLEAN DEFAULT false,
  slide_interval INTEGER DEFAULT 5000,
  show_description BOOLEAN DEFAULT true,
  show_subtitle BOOLEAN DEFAULT true,
  columns_desktop INTEGER DEFAULT 4,
  columns_tablet INTEGER DEFAULT 2,
  columns_mobile INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Site Branding Settings Table
CREATE TABLE public.site_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  logo_text TEXT DEFAULT 'artistiya',
  logo_text_secondary TEXT DEFAULT '.store',
  favicon_url TEXT,
  header_announcement_text TEXT DEFAULT '✨ Free shipping on orders over ৳5,000 ✨',
  header_announcement_active BOOLEAN DEFAULT true,
  footer_description TEXT DEFAULT 'Where every piece tells a story of tradition, artistry, and elegance.',
  footer_copyright TEXT DEFAULT '© 2026 artistiya.store. All rights reserved.',
  social_instagram TEXT DEFAULT 'https://instagram.com',
  social_facebook TEXT DEFAULT 'https://facebook.com',
  social_email TEXT DEFAULT 'hello@artistiya.store',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menu Items Table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  parent_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  menu_type TEXT DEFAULT 'header', -- header, footer
  is_mega_menu BOOLEAN DEFAULT false,
  banner_title TEXT,
  banner_subtitle TEXT,
  banner_link TEXT,
  banner_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menu Sub Items (for mega menu categories)
CREATE TABLE public.menu_sub_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  image_url TEXT,
  items TEXT[], -- array of sub items
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Footer Link Groups Table
CREATE TABLE public.footer_link_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Footer Links Table
CREATE TABLE public.footer_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.footer_link_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  href TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checkout Settings Table
CREATE TABLE public.checkout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  require_phone BOOLEAN DEFAULT true,
  require_address BOOLEAN DEFAULT true,
  show_order_notes BOOLEAN DEFAULT true,
  show_gift_message BOOLEAN DEFAULT false,
  show_promo_code BOOLEAN DEFAULT true,
  show_shipping_calculator BOOLEAN DEFAULT false,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 5000,
  default_shipping_cost DECIMAL(10,2) DEFAULT 100,
  cod_enabled BOOLEAN DEFAULT true,
  cod_extra_charge DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_sub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_link_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies for all tables
CREATE POLICY "Allow public read for hero_slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow public read for category_display_settings" ON public.category_display_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read for site_branding" ON public.site_branding FOR SELECT USING (true);
CREATE POLICY "Allow public read for menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read for menu_sub_items" ON public.menu_sub_items FOR SELECT USING (true);
CREATE POLICY "Allow public read for footer_link_groups" ON public.footer_link_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read for footer_links" ON public.footer_links FOR SELECT USING (true);
CREATE POLICY "Allow public read for checkout_settings" ON public.checkout_settings FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Allow admin write for hero_slides" ON public.hero_slides FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for category_display_settings" ON public.category_display_settings FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for site_branding" ON public.site_branding FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for menu_items" ON public.menu_items FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for menu_sub_items" ON public.menu_sub_items FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for footer_link_groups" ON public.footer_link_groups FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for footer_links" ON public.footer_links FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin write for checkout_settings" ON public.checkout_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Insert default data
INSERT INTO public.hero_slides (title, title_highlight, title_end, badge_text, description, button_text, button_link, secondary_button_text, secondary_button_link, display_order)
VALUES 
  ('Artistry Woven,', 'Elegance', 'Defined', 'Premium Handcrafted Collection', 'Discover the artistry of handcrafted jewelry, hand-painted bags, and woven masterpieces. Each piece carries the legacy of Bengali craftsmanship.', 'Shop Now', '/shop', 'View Collections', '/collections', 0);

INSERT INTO public.category_display_settings (section_title, section_subtitle)
VALUES ('Shop by Category', 'Explore Our World');

INSERT INTO public.site_branding (logo_text, logo_text_secondary, header_announcement_text, footer_description)
VALUES ('artistiya', '.store', '✨ Free shipping on orders over ৳5,000 ✨', 'Where every piece tells a story of tradition, artistry, and elegance.');

INSERT INTO public.checkout_settings (require_phone, require_address, show_order_notes, show_promo_code)
VALUES (true, true, true, true);

-- Insert default footer link groups
INSERT INTO public.footer_link_groups (title, display_order) VALUES ('Shop', 0), ('Help', 1), ('Company', 2);

-- Triggers for updated_at
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_category_display_settings_updated_at BEFORE UPDATE ON public.category_display_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_branding_updated_at BEFORE UPDATE ON public.site_branding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_sub_items_updated_at BEFORE UPDATE ON public.menu_sub_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_footer_link_groups_updated_at BEFORE UPDATE ON public.footer_link_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_footer_links_updated_at BEFORE UPDATE ON public.footer_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checkout_settings_updated_at BEFORE UPDATE ON public.checkout_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();