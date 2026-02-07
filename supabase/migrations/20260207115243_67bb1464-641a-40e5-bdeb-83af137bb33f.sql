-- Fix 1: Restrict product-images bucket to admins only
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- Fix 2: Restrict testimonials bucket to admins only
DROP POLICY IF EXISTS "Authenticated users can upload testimonial photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload testimonial photos" ON storage.objects;

CREATE POLICY "Admins can upload testimonial photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'testimonials' AND public.is_admin(auth.uid()));