-- Create or update function to sync customers from orders
CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
  addr_record RECORD;
BEGIN
  -- Get address details
  SELECT * INTO addr_record FROM public.addresses WHERE id = NEW.address_id;
  
  IF addr_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if customer already exists with this user_id
  SELECT * INTO customer_record FROM public.customers WHERE user_id = NEW.user_id;
  
  IF customer_record IS NOT NULL THEN
    -- Update existing customer
    UPDATE public.customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(NEW.total, 0),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    -- Get email from auth.users if available
    DECLARE
      user_email TEXT;
    BEGIN
      SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
      
      -- Insert new customer
      INSERT INTO public.customers (
        user_id,
        email,
        full_name,
        phone,
        total_orders,
        total_spent,
        discount_percentage,
        is_premium_member
      ) VALUES (
        NEW.user_id,
        COALESCE(user_email, 'unknown@email.com'),
        addr_record.full_name,
        addr_record.phone,
        1,
        COALESCE(NEW.total, 0),
        0,
        false
      )
      ON CONFLICT (user_id) DO UPDATE
      SET 
        total_orders = customers.total_orders + 1,
        total_spent = customers.total_spent + COALESCE(NEW.total, 0),
        updated_at = NOW();
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS sync_customer_on_order ON public.orders;
CREATE TRIGGER sync_customer_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_from_order();

-- Add unique constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_key'
  ) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Sync existing orders to customers (one-time migration)
INSERT INTO public.customers (user_id, email, full_name, phone, total_orders, total_spent, discount_percentage, is_premium_member)
SELECT 
  o.user_id,
  COALESCE(u.email, 'unknown@email.com'),
  a.full_name,
  a.phone,
  COUNT(*)::int as total_orders,
  SUM(COALESCE(o.total, 0)) as total_spent,
  0,
  false
FROM public.orders o
LEFT JOIN public.addresses a ON o.address_id = a.id
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE o.user_id IS NOT NULL
GROUP BY o.user_id, u.email, a.full_name, a.phone
ON CONFLICT (user_id) DO UPDATE
SET 
  total_orders = EXCLUDED.total_orders,
  total_spent = EXCLUDED.total_spent,
  full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
  phone = COALESCE(EXCLUDED.phone, customers.phone),
  updated_at = NOW();