-- Create promo_codes table for discount/secret codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2) DEFAULT NULL,
  usage_limit INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  applicable_categories UUID[] DEFAULT NULL,
  applicable_products UUID[] DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table for user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  title_bn VARCHAR(255),
  message TEXT NOT NULL,
  message_bn TEXT,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'promo', 'order')),
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  link_url VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create promo_code_usage table to track usage
CREATE TABLE public.promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID,
  discount_applied NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Promo codes policies (admins can manage, public can read active codes)
CREATE POLICY "Anyone can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Promo code usage policies
CREATE POLICY "Users can view their own usage" 
ON public.promo_code_usage 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage" 
ON public.promo_code_usage 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all usage" 
ON public.promo_code_usage 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_global ON public.notifications(is_global);
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;