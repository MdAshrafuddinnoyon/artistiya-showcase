-- Fix SECURITY DEFINER view issue by using security_invoker
DROP VIEW IF EXISTS public.public_site_branding;

CREATE VIEW public.public_site_branding 
WITH (security_invoker = on) AS
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
  auto_sync_google_reviews,
  hide_manual_reviews_when_api_active,
  created_at,
  updated_at
FROM public.site_branding;

GRANT SELECT ON public.public_site_branding TO anon, authenticated;