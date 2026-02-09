-- Add form customization fields to customization_settings
ALTER TABLE public.customization_settings
ADD COLUMN IF NOT EXISTS form_title VARCHAR(200) DEFAULT 'Submit Your Design',
ADD COLUMN IF NOT EXISTS form_title_bn VARCHAR(200) DEFAULT 'আপনার ডিজাইন জমা দিন',
ADD COLUMN IF NOT EXISTS form_subtitle VARCHAR(500) DEFAULT 'Upload your design idea and we will make it for you',
ADD COLUMN IF NOT EXISTS form_subtitle_bn VARCHAR(500) DEFAULT 'আপনার ডিজাইন আইডিয়া আপলোড করুন, আমরা আপনার জন্য তৈরি করব',
ADD COLUMN IF NOT EXISTS form_description_label VARCHAR(200) DEFAULT 'Detailed Description',
ADD COLUMN IF NOT EXISTS form_description_placeholder VARCHAR(500) DEFAULT 'Describe your preferred colors, size, materials, and other details...',
ADD COLUMN IF NOT EXISTS require_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_budget_fields BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS success_message VARCHAR(500) DEFAULT 'Your custom order request has been submitted!',
ADD COLUMN IF NOT EXISTS success_message_bn VARCHAR(500) DEFAULT 'আপনার কাস্টম অর্ডার রিকোয়েস্ট জমা দেওয়া হয়েছে!';

-- Add comments
COMMENT ON COLUMN public.customization_settings.form_title IS 'Title shown in the custom order form modal';
COMMENT ON COLUMN public.customization_settings.require_image IS 'Whether reference image is required or optional';
COMMENT ON COLUMN public.customization_settings.show_budget_fields IS 'Show budget min/max fields in the form';