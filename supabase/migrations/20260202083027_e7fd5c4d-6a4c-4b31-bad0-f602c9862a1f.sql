-- Add DELETE policies for admins on orders table
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add DELETE policies for admins on order_items table  
CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add DELETE policy for admins on addresses table (for cleanup)
CREATE POLICY "Admins can delete addresses"
ON public.addresses
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add UPDATE policy for admins on order_items (for completeness)
CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));