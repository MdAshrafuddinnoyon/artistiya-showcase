-- Remove duplicate/old site_branding public read policy
DROP POLICY IF EXISTS "Allow public read for site_branding" ON public.site_branding;

-- Update abandoned_carts policy to require authentication
DROP POLICY IF EXISTS "Anyone can create abandoned cart" ON public.abandoned_carts;
CREATE POLICY "Authenticated users can create abandoned cart"
ON public.abandoned_carts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Newsletter subscribers - keep public but add simple rate limiting
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create rate limiting function for newsletter
CREATE OR REPLACE FUNCTION public.can_subscribe_newsletter(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check if email already subscribed
  SELECT COUNT(*) INTO recent_count
  FROM public.newsletter_subscribers
  WHERE email = p_email;
  
  -- Don't allow duplicate subscriptions
  RETURN recent_count = 0;
END;
$$;

CREATE POLICY "Rate limited newsletter subscribe"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (public.can_subscribe_newsletter(email));