-- Create table for abandoned carts to track customers who left without completing order
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  cart_data JSONB DEFAULT '[]'::jsonb,
  cart_total NUMERIC DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_recovered BOOLEAN DEFAULT false,
  recovered_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage abandoned carts" 
ON public.abandoned_carts 
FOR ALL 
USING (is_admin(auth.uid()));

-- Users can see their own abandoned carts
CREATE POLICY "Users can view own abandoned carts"
ON public.abandoned_carts
FOR SELECT
USING (auth.uid() = user_id);

-- Allow inserting abandoned carts without auth (for guests)
CREATE POLICY "Anyone can create abandoned cart"
ON public.abandoned_carts
FOR INSERT
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON public.abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON public.abandoned_carts(created_at);

-- Add admin delete policy for customers table
CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
USING (is_admin(auth.uid()));

-- Add admin update policy for customers table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Admins can update customers'
  ) THEN
    CREATE POLICY "Admins can update customers"
    ON public.customers
    FOR UPDATE
    USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Add admin insert policy for customers table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Admins can insert customers'
  ) THEN
    CREATE POLICY "Admins can insert customers"
    ON public.customers
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Add admin select policy for customers table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Admins can view all customers'
  ) THEN
    CREATE POLICY "Admins can view all customers"
    ON public.customers
    FOR SELECT
    USING (is_admin(auth.uid()));
  END IF;
END $$;