-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source TEXT DEFAULT 'footer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert their own email)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage subscribers
CREATE POLICY "Admins can manage subscribers"
ON public.newsletter_subscribers
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create newsletter settings table
CREATE TABLE IF NOT EXISTS public.newsletter_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT true,
    title TEXT DEFAULT 'Join Our Artistic Journey',
    title_bn TEXT,
    subtitle TEXT DEFAULT 'Subscribe to receive updates on new collections and exclusive offers',
    subtitle_bn TEXT,
    button_text TEXT DEFAULT 'Subscribe',
    button_text_bn TEXT,
    placeholder_text TEXT DEFAULT 'Enter your email',
    success_message TEXT DEFAULT 'Thank you for subscribing!',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Anyone can read newsletter settings"
ON public.newsletter_settings
FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage newsletter settings"
ON public.newsletter_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Insert default newsletter settings
INSERT INTO public.newsletter_settings (title, subtitle, button_text, placeholder_text)
VALUES (
    'Join Our Artistic Journey',
    'Subscribe to receive updates on new collections and exclusive offers',
    'Subscribe',
    'Enter your email'
) ON CONFLICT DO NOTHING;

-- Enable realtime for newsletter settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.newsletter_settings;