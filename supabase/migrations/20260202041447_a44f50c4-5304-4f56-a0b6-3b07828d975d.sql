-- ===========================================================================
-- FIX #1: GUEST CHECKOUT & GUEST ADDRESS SUPPORT
-- ===========================================================================

-- Drop existing policies that block guests
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can add to cart" ON public.cart_items;

-- Allow authenticated users AND guests (anon) to place orders
CREATE POLICY "Authenticated users can create own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guest users can create orders"
ON public.orders FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

-- Allow authenticated users AND guests (anon) to create addresses
CREATE POLICY "Authenticated users can create addresses"
ON public.addresses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guest users can create addresses"
ON public.addresses FOR INSERT TO anon
WITH CHECK (user_id IS NOT NULL); -- guest placeholder UUID

-- Allow authenticated users AND guests (anon) to add order items
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Authenticated users can create order items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
));

CREATE POLICY "Guest users can create order items"
ON public.order_items FOR INSERT TO anon
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
));

-- ===========================================================================
-- FIX #2: ADMIN CRUD FOR PRODUCTS, CATEGORIES, COLLECTIONS
-- ===========================================================================

-- PRODUCTS: Admin INSERT / UPDATE / DELETE
CREATE POLICY "Admins can create products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- Also allow admins to SELECT all products (including inactive)
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;

CREATE POLICY "Products viewable by everyone (active) or admin (all)"
ON public.products FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- CATEGORIES: Admin INSERT / UPDATE / DELETE
CREATE POLICY "Admins can create categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- COLLECTIONS: ensure RLS enabled and add admin policies
ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collections viewable by everyone" ON public.collections;
CREATE POLICY "Collections viewable by everyone"
ON public.collections FOR SELECT USING (true);

CREATE POLICY "Admins can create collections"
ON public.collections FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update collections"
ON public.collections FOR UPDATE TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete collections"
ON public.collections FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- ===========================================================================
-- FIX #3: MANUAL PAYMENT OPTIONS (Add enum value if not present)
-- ===========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bank_transfer' AND enumtypid = 'public.payment_method'::regtype) THEN
    ALTER TYPE public.payment_method ADD VALUE 'bank_transfer';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;