-- Fix site_branding - deny direct SELECT for non-admins, use public view instead
DROP POLICY IF EXISTS "Anyone can read site branding" ON public.site_branding;

CREATE POLICY "Admin or public view only - site_branding select"
ON public.site_branding FOR SELECT
USING (public.is_admin(auth.uid()));

-- Note: Public users should use public_site_branding view which excludes google_api_key

-- Leads table - Add rate limiting by checking recent submissions
-- First, create a function to check if IP/email has submitted recently
CREATE OR REPLACE FUNCTION public.can_submit_lead(p_email text, p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check submissions in last 5 minutes from same email or phone
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE (email = p_email OR phone = p_phone)
  AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Allow max 3 submissions per 5 minutes
  RETURN recent_count < 3;
END;
$$;

-- Update leads insert policy to use rate limiting
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY "Rate limited lead insert"
ON public.leads FOR INSERT
WITH CHECK (
  public.can_submit_lead(email, phone)
);

-- addresses table - ensure guest isolation
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses"
ON public.addresses FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own addresses" ON public.addresses;
CREATE POLICY "Users can create their own addresses"
ON public.addresses FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses"
ON public.addresses FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses"
ON public.addresses FOR DELETE
USING (auth.uid() = user_id);

-- orders table - fix guest order isolation
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (
  public.is_admin(auth.uid()) 
  OR (user_id IS NOT NULL AND auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);