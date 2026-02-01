-- Footer authorization logos (left/right)
ALTER TABLE public.site_branding
ADD COLUMN IF NOT EXISTS footer_left_logo_url TEXT,
ADD COLUMN IF NOT EXISTS footer_right_logo_url TEXT,
ADD COLUMN IF NOT EXISTS footer_left_logo_link TEXT,
ADD COLUMN IF NOT EXISTS footer_right_logo_link TEXT;

-- About page certifications table
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_bn TEXT,
  description TEXT,
  description_bn TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for certifications
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Certifications are viewable by everyone" 
ON public.certifications 
FOR SELECT 
USING (true);

-- Admin manage policy
CREATE POLICY "Admins can manage certifications" 
ON public.certifications 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Content pages - add language tab labels
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS lang1_label TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS lang2_label TEXT DEFAULT 'বাংলা';

-- Gallery/Archive albums table
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_bn TEXT,
  description TEXT,
  description_bn TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gallery items table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  title TEXT,
  title_bn TEXT,
  description TEXT,
  description_bn TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for gallery tables
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Gallery albums are viewable by everyone" 
ON public.gallery_albums 
FOR SELECT 
USING (true);

CREATE POLICY "Gallery items are viewable by everyone" 
ON public.gallery_items 
FOR SELECT 
USING (true);

-- Admin manage policies
CREATE POLICY "Admins can manage gallery albums" 
ON public.gallery_albums 
FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage gallery items" 
ON public.gallery_items 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Instagram settings table for dynamic connection
ALTER TABLE public.homepage_content
ADD COLUMN IF NOT EXISTS instagram_access_token TEXT,
ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;

-- Update triggers for new tables
CREATE TRIGGER update_certifications_updated_at
BEFORE UPDATE ON public.certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_albums_updated_at
BEFORE UPDATE ON public.gallery_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();