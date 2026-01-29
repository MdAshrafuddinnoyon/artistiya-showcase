-- Add new fields to hero_slides for banner-only mode and overlay control
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS show_title boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_description boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_badge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_primary_button boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_secondary_button boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS image_link_url text,
ADD COLUMN IF NOT EXISTS overlay_position text DEFAULT 'left',
ADD COLUMN IF NOT EXISTS overlay_enabled boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.hero_slides.show_title IS 'Toggle visibility of title text';
COMMENT ON COLUMN public.hero_slides.show_description IS 'Toggle visibility of description';
COMMENT ON COLUMN public.hero_slides.show_badge IS 'Toggle visibility of badge';
COMMENT ON COLUMN public.hero_slides.show_primary_button IS 'Toggle visibility of primary button';
COMMENT ON COLUMN public.hero_slides.show_secondary_button IS 'Toggle visibility of secondary button';
COMMENT ON COLUMN public.hero_slides.image_link_url IS 'URL to navigate when clicking the banner image';
COMMENT ON COLUMN public.hero_slides.overlay_position IS 'Position of overlay gradient: left, right, top, bottom, center';
COMMENT ON COLUMN public.hero_slides.overlay_enabled IS 'Enable/disable the overlay gradient';