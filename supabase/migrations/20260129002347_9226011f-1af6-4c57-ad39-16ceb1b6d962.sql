-- Fix: Allow admins to view ALL orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Allow admins to view all order items
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Allow admins to manage addresses (for viewing order addresses)
CREATE POLICY "Admins can view all addresses" 
ON public.addresses 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create order_fraud_flags table for fake order detection
CREATE TABLE IF NOT EXISTS public.order_fraud_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'duplicate_phone', 'rate_limit', 'suspicious_pattern', 'high_risk'
  flag_reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fraud flags
ALTER TABLE public.order_fraud_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can see fraud flags
CREATE POLICY "Admins can manage fraud flags" 
ON public.order_fraud_flags 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add fraud_score column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create function to check for duplicate phone orders (same phone, multiple orders in 24h)
CREATE OR REPLACE FUNCTION public.check_order_fraud()
RETURNS TRIGGER AS $$
DECLARE
  phone_count INTEGER;
  recent_orders_count INTEGER;
  fraud_score INTEGER := 0;
  address_phone TEXT;
BEGIN
  -- Get phone from address
  SELECT phone INTO address_phone FROM public.addresses WHERE id = NEW.address_id;
  
  -- Check: Multiple orders from same phone in last 24 hours
  SELECT COUNT(*) INTO phone_count
  FROM public.orders o
  JOIN public.addresses a ON o.address_id = a.id
  WHERE a.phone = address_phone
  AND o.created_at > NOW() - INTERVAL '24 hours'
  AND o.id != NEW.id;
  
  IF phone_count >= 3 THEN
    fraud_score := fraud_score + 50;
    INSERT INTO public.order_fraud_flags (order_id, flag_type, flag_reason, severity)
    VALUES (NEW.id, 'rate_limit', 'Same phone number placed ' || (phone_count + 1) || ' orders in 24 hours', 'high');
  ELSIF phone_count >= 1 THEN
    fraud_score := fraud_score + 20;
    INSERT INTO public.order_fraud_flags (order_id, flag_type, flag_reason, severity)
    VALUES (NEW.id, 'duplicate_phone', 'Multiple orders from same phone in 24 hours', 'medium');
  END IF;
  
  -- Check: High value order (potential fraud)
  IF NEW.total > 50000 THEN
    fraud_score := fraud_score + 30;
    INSERT INTO public.order_fraud_flags (order_id, flag_type, flag_reason, severity)
    VALUES (NEW.id, 'high_risk', 'High value order: ৳' || NEW.total, 'medium');
  END IF;
  
  -- Check: COD orders from new phones (no previous completed orders)
  IF NEW.payment_method = 'cod' THEN
    SELECT COUNT(*) INTO recent_orders_count
    FROM public.orders o
    JOIN public.addresses a ON o.address_id = a.id
    WHERE a.phone = address_phone
    AND o.status = 'delivered';
    
    IF recent_orders_count = 0 AND NEW.total > 10000 THEN
      fraud_score := fraud_score + 25;
      INSERT INTO public.order_fraud_flags (order_id, flag_type, flag_reason, severity)
      VALUES (NEW.id, 'suspicious_pattern', 'High value COD from new customer', 'medium');
    END IF;
  END IF;
  
  -- Update order with fraud score
  NEW.fraud_score := fraud_score;
  NEW.is_flagged := fraud_score >= 50;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for fraud check
DROP TRIGGER IF EXISTS check_order_fraud_trigger ON public.orders;
CREATE TRIGGER check_order_fraud_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_fraud();

-- Update testimonials table to add customer photo support
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS customer_photo_url TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- Storage bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for testimonial photos
CREATE POLICY "Testimonial photos are public" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'testimonials');

CREATE POLICY "Authenticated users can upload testimonial photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'testimonials' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete testimonial photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'testimonials' AND public.is_admin(auth.uid()));