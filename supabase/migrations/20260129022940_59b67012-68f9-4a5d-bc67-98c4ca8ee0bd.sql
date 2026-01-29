-- Add product features columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS story_bn TEXT;

-- Create site_integrations table for Google and other integrations
CREATE TABLE IF NOT EXISTS public.site_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_key TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_settings table for email configuration
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_password TEXT,
    from_email TEXT,
    from_name TEXT,
    reply_to_email TEXT,
    is_enabled BOOLEAN DEFAULT false,
    provider TEXT DEFAULT 'smtp',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.site_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for site_integrations (admin only)
CREATE POLICY "Admin can view integrations" ON public.site_integrations
    FOR SELECT USING (public.is_admin(auth.uid()));
    
CREATE POLICY "Admin can insert integrations" ON public.site_integrations
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
    
CREATE POLICY "Admin can update integrations" ON public.site_integrations
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Create RLS policies for email_settings (admin only)
CREATE POLICY "Admin can view email settings" ON public.email_settings
    FOR SELECT USING (public.is_admin(auth.uid()));
    
CREATE POLICY "Admin can insert email settings" ON public.email_settings
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
    
CREATE POLICY "Admin can update email settings" ON public.email_settings
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Add parent_id support to blog_categories for subcategories
ALTER TABLE public.blog_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.blog_categories(id);

-- Insert default integrations
INSERT INTO public.site_integrations (integration_key, settings, is_active) VALUES
    ('google_analytics', '{"tracking_id": "", "measurement_id": ""}', false),
    ('google_search_console', '{"verification_code": ""}', false),
    ('facebook_pixel', '{"pixel_id": ""}', false),
    ('google_tag_manager', '{"container_id": ""}', false)
ON CONFLICT (integration_key) DO NOTHING;

-- Insert default email settings
INSERT INTO public.email_settings (provider, is_enabled) VALUES ('smtp', false)
ON CONFLICT DO NOTHING;

-- Update timestamp trigger for new tables
CREATE TRIGGER update_site_integrations_updated_at
    BEFORE UPDATE ON public.site_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON public.email_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();