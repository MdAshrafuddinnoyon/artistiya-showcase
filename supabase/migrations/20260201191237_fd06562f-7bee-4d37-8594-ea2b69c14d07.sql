-- Add page_type to faq_items for different page contexts
ALTER TABLE public.faq_items 
ADD COLUMN IF NOT EXISTS page_type text DEFAULT 'faq' 
CHECK (page_type IN ('homepage', 'checkout', 'about', 'faq'));

-- Update existing FAQs to be on the faq page by default
UPDATE public.faq_items SET page_type = 'faq' WHERE page_type IS NULL;

-- Create collections table for curated collections
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_bn TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Collections are viewable by everyone" 
ON public.collections FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage collections" 
ON public.collections FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add google_place_id to testimonials for Google Business integration
ALTER TABLE public.testimonials 
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'manual' CHECK (platform IN ('manual', 'google', 'facebook', 'instagram'));

-- Update trigger for collections
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();