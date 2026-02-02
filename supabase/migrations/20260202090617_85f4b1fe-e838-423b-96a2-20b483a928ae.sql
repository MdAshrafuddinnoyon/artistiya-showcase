-- Fix search_path for the function
CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
  addr_record RECORD;
  user_email TEXT;
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
      total_orders = public.customers.total_orders + 1,
      total_spent = public.customers.total_spent + COALESCE(NEW.total, 0),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;