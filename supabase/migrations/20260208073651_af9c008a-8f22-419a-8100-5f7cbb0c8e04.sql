-- Fix user_roles RLS infinite recursion by using SECURITY DEFINER function

-- First drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create a SECURITY DEFINER function to check admin status without RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  )
$$;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));