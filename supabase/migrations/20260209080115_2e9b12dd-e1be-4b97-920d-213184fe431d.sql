-- Add button text customization fields to customization_settings
ALTER TABLE public.customization_settings
ADD COLUMN IF NOT EXISTS header_button_text VARCHAR(100) DEFAULT 'Custom Design',
ADD COLUMN IF NOT EXISTS header_button_text_bn VARCHAR(100) DEFAULT 'কাস্টম ডিজাইন',
ADD COLUMN IF NOT EXISTS header_button_link VARCHAR(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS header_button_icon VARCHAR(50) DEFAULT 'Palette';

-- Add comment for documentation
COMMENT ON COLUMN public.customization_settings.header_button_text IS 'Custom text for the header button';
COMMENT ON COLUMN public.customization_settings.header_button_text_bn IS 'Bengali text for the header button';
COMMENT ON COLUMN public.customization_settings.header_button_link IS 'Optional custom link URL - if null, opens custom order modal';
COMMENT ON COLUMN public.customization_settings.header_button_icon IS 'Lucide icon name for the button';