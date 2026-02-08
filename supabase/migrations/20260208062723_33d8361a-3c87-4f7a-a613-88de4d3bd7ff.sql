-- =====================================================
-- SITE BRANDING SECURITY - Create secure public view
-- =====================================================

-- Create a secure view for public branding that excludes API keys
CREATE OR REPLACE VIEW public.public_site_branding AS
SELECT 
  id,
  logo_url,
  logo_text,
  logo_text_secondary,
  favicon_url,
  header_announcement_text,
  header_announcement_active,
  footer_description,
  footer_copyright,
  social_instagram,
  social_facebook,
  social_email,
  social_whatsapp,
  show_logo_text,
  footer_logo_size,
  footer_banner_url,
  footer_banner_link,
  footer_banner_height,
  payment_methods,
  signup_discount_percent,
  signup_discount_enabled,
  footer_left_logo_url,
  footer_right_logo_url,
  footer_left_logo_link,
  footer_right_logo_link,
  contact_phone,
  contact_address,
  contact_address_bn,
  business_hours,
  business_hours_bn,
  google_maps_embed_url,
  contact_page_title,
  contact_page_title_bn,
  contact_page_subtitle,
  contact_page_subtitle_bn,
  -- Exclude sensitive: google_api_key, google_place_id
  auto_sync_google_reviews,
  hide_manual_reviews_when_api_active,
  created_at,
  updated_at
FROM public.site_branding;

-- Grant access to the public view
GRANT SELECT ON public.public_site_branding TO anon, authenticated;

-- Secure the main site_branding table for admin only write
DROP POLICY IF EXISTS "Admin only - site_branding write" ON public.site_branding;
CREATE POLICY "Admin only - site_branding write"
ON public.site_branding FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin only - site_branding update" ON public.site_branding;
CREATE POLICY "Admin only - site_branding update"
ON public.site_branding FOR UPDATE
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin only - site_branding delete" ON public.site_branding;
CREATE POLICY "Admin only - site_branding delete"
ON public.site_branding FOR DELETE
USING (public.is_admin(auth.uid()));