-- Create customers table for extended customer management
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  is_premium_member BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admin can manage all customers
CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create announcement bar table for dynamic notifications
CREATE TABLE IF NOT EXISTS public.announcement_bar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  message_bn TEXT,
  link_url TEXT,
  link_text TEXT,
  background_color TEXT DEFAULT '#D4AF37',
  text_color TEXT DEFAULT '#1A1A1A',
  is_active BOOLEAN DEFAULT true,
  show_on_desktop BOOLEAN DEFAULT true,
  show_on_mobile BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for announcement_bar
ALTER TABLE public.announcement_bar ENABLE ROW LEVEL SECURITY;

-- Everyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
ON public.announcement_bar
FOR SELECT
USING (is_active = true);

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements"
ON public.announcement_bar
FOR ALL
USING (public.is_admin(auth.uid()));

-- Enable realtime for announcement_bar
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_bar;

-- Add favicon_url to site_branding if not exists
ALTER TABLE public.site_branding 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcement_bar_updated_at
BEFORE UPDATE ON public.announcement_bar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();