-- Add contact information fields to site_branding
ALTER TABLE public.site_branding 
ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '+880 1700-000-000',
ADD COLUMN IF NOT EXISTS contact_address TEXT DEFAULT 'Dhaka, Bangladesh',
ADD COLUMN IF NOT EXISTS contact_address_bn TEXT,
ADD COLUMN IF NOT EXISTS business_hours TEXT DEFAULT 'Sat - Thu: 10:00 AM - 8:00 PM',
ADD COLUMN IF NOT EXISTS business_hours_bn TEXT,
ADD COLUMN IF NOT EXISTS social_whatsapp TEXT DEFAULT '8801700000000',
ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT,
ADD COLUMN IF NOT EXISTS contact_page_title TEXT DEFAULT 'Contact Us',
ADD COLUMN IF NOT EXISTS contact_page_title_bn TEXT DEFAULT 'যোগাযোগ করুন',
ADD COLUMN IF NOT EXISTS contact_page_subtitle TEXT DEFAULT 'Have questions about our products or want to discuss a custom order? We''d love to hear from you.',
ADD COLUMN IF NOT EXISTS contact_page_subtitle_bn TEXT;