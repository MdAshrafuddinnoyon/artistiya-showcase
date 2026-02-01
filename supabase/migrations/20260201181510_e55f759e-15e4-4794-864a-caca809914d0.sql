-- Add image fit mode to hero_slides table
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'cover';

-- Add text_alignment if not exists
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS text_alignment TEXT DEFAULT 'left';

-- Create featured_sections table for Signature Collection section
CREATE TABLE IF NOT EXISTS public.featured_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT UNIQUE NOT NULL DEFAULT 'signature',
  badge_text TEXT DEFAULT 'Signature Collection',
  title_line1 TEXT DEFAULT 'The Floral Bloom',
  title_highlight TEXT DEFAULT 'Tote Collection',
  description TEXT,
  features TEXT[] DEFAULT ARRAY['100% Genuine Leather', 'Hand-painted by skilled artisans', 'Water-resistant coating', 'Limited edition pieces'],
  button_text TEXT DEFAULT 'Explore Collection',
  button_link TEXT DEFAULT '/collections/floral-bloom',
  price_text TEXT DEFAULT 'From ৳3,800',
  image_url TEXT,
  layout TEXT DEFAULT 'image-left', -- 'image-left' or 'image-right'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create making_section table for Behind the Craft section
CREATE TABLE IF NOT EXISTS public.making_section (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_text TEXT DEFAULT 'Behind the Craft',
  title_line1 TEXT DEFAULT 'Behind Every Piece',
  title_highlight TEXT DEFAULT 'An Artisan''s Story',
  description TEXT DEFAULT 'Every piece at artistiya.store is born from hours of dedication, traditional techniques passed down through generations, and a passion for perfection.',
  button_text TEXT DEFAULT 'Read Our Story',
  button_link TEXT DEFAULT '/about',
  background_image_url TEXT,
  stat1_number TEXT DEFAULT '500+',
  stat1_label TEXT DEFAULT 'Handcrafted Pieces',
  stat2_number TEXT DEFAULT '15+',
  stat2_label TEXT DEFAULT 'Skilled Artisans',
  stat3_number TEXT DEFAULT '1000+',
  stat3_label TEXT DEFAULT 'Happy Customers',
  overlay_opacity INTEGER DEFAULT 85,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add more section types support to homepage_sections config
-- Add dual_banner and single_banner support

-- Enable RLS
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.making_section ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read featured_sections" ON public.featured_sections FOR SELECT USING (true);
CREATE POLICY "Anyone can read making_section" ON public.making_section FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can update featured_sections" ON public.featured_sections FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert featured_sections" ON public.featured_sections FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete featured_sections" ON public.featured_sections FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update making_section" ON public.making_section FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert making_section" ON public.making_section FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete making_section" ON public.making_section FOR DELETE USING (public.is_admin(auth.uid()));

-- Insert default data
INSERT INTO public.featured_sections (section_key, badge_text, title_line1, title_highlight, description, button_text, button_link, price_text, layout)
VALUES ('signature', 'Signature Collection', 'The Floral Bloom', 'Tote Collection', 
        'Each bag in this collection is a canvas of nature''s beauty, hand-painted with meticulous attention to detail. Inspired by the vibrant flora of Bengal, these pieces transform everyday accessories into wearable art.',
        'Explore Collection', '/collections/floral-bloom', 'From ৳3,800', 'image-left')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.making_section (badge_text, title_line1, title_highlight, description, button_text, button_link)
VALUES ('Behind the Craft', 'Behind Every Piece', 'An Artisan''s Story',
        'Every piece at artistiya.store is born from hours of dedication, traditional techniques passed down through generations, and a passion for perfection. From selecting the finest materials to the final finishing touches, our artisans pour their heart into each creation.',
        'Read Our Story', '/about')
ON CONFLICT DO NOTHING;