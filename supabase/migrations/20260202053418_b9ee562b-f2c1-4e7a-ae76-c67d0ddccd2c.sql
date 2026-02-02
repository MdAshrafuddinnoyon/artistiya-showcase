-- Fix overly-permissive public INSERT policy on leads (avoid WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;

CREATE POLICY "Anyone can submit leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND length(btrim(name)) > 0
  );

-- Enable realtime for cart_items
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;