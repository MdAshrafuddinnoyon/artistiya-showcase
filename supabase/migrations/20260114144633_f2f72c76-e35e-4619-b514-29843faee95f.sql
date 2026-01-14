-- Create user_roles table for admin access control
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles (we'll use a function for this)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create site_settings table for admin customization
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_number', '"8801XXXXXXXXX"'),
  ('facebook_page_id', '""'),
  ('bkash_number', '"01XXXXXXXXX"'),
  ('nagad_number', '"01XXXXXXXXX"'),
  ('free_shipping_threshold', '5000'),
  ('dhaka_shipping_cost', '80'),
  ('outside_dhaka_shipping_cost', '130'),
  ('show_payment_banner', 'true'),
  ('announcement_text', '"✨ Free shipping on orders over ৳5,000 ✨"'),
  ('announcement_text_bn', '"✨ ৳৫,০০০+ অর্ডারে ফ্রি শিপিং ✨"');

-- Trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();