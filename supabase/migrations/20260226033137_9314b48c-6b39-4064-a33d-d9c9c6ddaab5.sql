
-- Add digital signature and social links fields to invoice_settings
ALTER TABLE public.invoice_settings 
  ADD COLUMN IF NOT EXISTS digital_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS signatory_name TEXT,
  ADD COLUMN IF NOT EXISTS signatory_title TEXT,
  ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_facebook TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS social_website TEXT,
  ADD COLUMN IF NOT EXISTS company_tagline TEXT DEFAULT 'Handcrafted with love';
