-- Create team_members table for About page
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  role TEXT NOT NULL,
  role_bn TEXT,
  bio TEXT,
  bio_bn TEXT,
  photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faq_items table for FAQ page
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  category_bn TEXT,
  question TEXT NOT NULL,
  question_bn TEXT,
  answer TEXT NOT NULL,
  answer_bn TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Team members are publicly viewable" 
ON public.team_members FOR SELECT USING (true);

CREATE POLICY "FAQ items are publicly viewable" 
ON public.faq_items FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage team members" 
ON public.team_members FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage FAQ items" 
ON public.faq_items FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();