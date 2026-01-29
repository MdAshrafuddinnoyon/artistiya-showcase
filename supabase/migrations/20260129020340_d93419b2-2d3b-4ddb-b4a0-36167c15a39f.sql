-- Step 1: Create blog_categories table first
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_categories
CREATE POLICY "Blog categories are publicly viewable" 
ON public.blog_categories FOR SELECT USING (true);

CREATE POLICY "Only admins can modify blog categories" 
ON public.blog_categories FOR ALL 
USING (public.is_admin(auth.uid()));

-- Step 2: Add category_id to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;

-- Step 3: Create blog_settings table
CREATE TABLE public.blog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_blog_active BOOLEAN DEFAULT true,
  banner_image_url TEXT,
  banner_link TEXT,
  banner_title TEXT,
  banner_title_bn TEXT,
  show_banner BOOLEAN DEFAULT false,
  posts_per_page INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.blog_settings (is_blog_active, show_banner, posts_per_page) 
VALUES (true, false, 10);

-- Enable RLS on blog_settings
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_settings
CREATE POLICY "Blog settings are publicly viewable" 
ON public.blog_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can modify blog settings" 
ON public.blog_settings FOR ALL 
USING (public.is_admin(auth.uid()));