-- Create currency_rates table
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL UNIQUE,
  currency_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rate_to_bdt NUMERIC(10,4) NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert default currencies
INSERT INTO public.currency_rates (currency_code, currency_name, symbol, rate_to_bdt) VALUES
('BDT', 'Bangladeshi Taka', '৳', 1),
('USD', 'US Dollar', '$', 0.0091),
('EUR', 'Euro', '€', 0.0084),
('GBP', 'British Pound', '£', 0.0072),
('INR', 'Indian Rupee', '₹', 0.76);

-- Enable RLS on currency_rates
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for currency_rates
CREATE POLICY "Currency rates are public" ON public.currency_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage currency rates" ON public.currency_rates
  FOR ALL USING (public.is_admin(auth.uid()));

-- Enable RLS on other new tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Published blogs are public" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage blogs" ON public.blog_posts
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for youtube_videos
CREATE POLICY "Active videos are public" ON public.youtube_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage videos" ON public.youtube_videos
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for leads
CREATE POLICY "Anyone can submit leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage leads" ON public.leads
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for delivery_providers
CREATE POLICY "Admins can manage delivery providers" ON public.delivery_providers
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for payment_providers
CREATE POLICY "Admins can manage payment providers" ON public.payment_providers
  FOR ALL USING (public.is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
('whatsapp', '{"number": "8801XXXXXXXXX", "message": "Hello! I am interested in your products."}'),
('google_analytics', '{"tracking_id": "", "is_active": false}'),
('facebook_pixel', '{"pixel_id": "", "is_active": false}'),
('homepage_sections', '{"show_blog": true, "show_youtube": true, "show_new_arrivals": true, "show_featured": true, "show_testimonials": true, "show_instagram": true}'),
('default_currency', '{"code": "BDT", "auto_detect": true}')
ON CONFLICT (key) DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_youtube_videos_updated_at BEFORE UPDATE ON public.youtube_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_providers_updated_at BEFORE UPDATE ON public.delivery_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_providers_updated_at BEFORE UPDATE ON public.payment_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();