-- Add icon fields to categories table for customizable icons
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS icon_name TEXT,
ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.categories.icon_name IS 'Lucide icon name for desktop display';
COMMENT ON COLUMN public.categories.icon_emoji IS 'Emoji fallback for mobile display';
COMMENT ON COLUMN public.categories.mobile_image_url IS 'Separate image URL for mobile view';