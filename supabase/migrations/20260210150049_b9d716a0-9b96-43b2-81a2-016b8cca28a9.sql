-- Add header logo size column
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS header_logo_size text DEFAULT 'medium';