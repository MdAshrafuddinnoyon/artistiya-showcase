-- Product Variations System for Color, Size, etc.

-- Create product_variants table for individual variants
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  color VARCHAR(100),
  color_code VARCHAR(20), -- Hex color code for display
  size VARCHAR(50),
  price_adjustment NUMERIC(10,2) DEFAULT 0, -- Price difference from base
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[], -- Variant-specific images
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_color ON public.product_variants(color) WHERE color IS NOT NULL;
CREATE INDEX idx_product_variants_size ON public.product_variants(size) WHERE size IS NOT NULL;

-- Create available_colors table for admin to define colors
CREATE TABLE public.product_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100),
  color_code VARCHAR(20) NOT NULL, -- Hex code
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create available_sizes table for admin to define sizes
CREATE TABLE public.product_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_bn VARCHAR(50),
  category VARCHAR(50), -- e.g., 'clothing', 'shoes', 'accessories'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for product_colors
CREATE POLICY "Public can view colors" ON public.product_colors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage colors" ON public.product_colors
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for product_sizes
CREATE POLICY "Public can view sizes" ON public.product_sizes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sizes" ON public.product_sizes
  FOR ALL USING (public.is_admin(auth.uid()));

-- Insert default colors
INSERT INTO public.product_colors (name, name_bn, color_code, display_order) VALUES
  ('Red', 'লাল', '#EF4444', 1),
  ('Blue', 'নীল', '#3B82F6', 2),
  ('Green', 'সবুজ', '#22C55E', 3),
  ('Yellow', 'হলুদ', '#EAB308', 4),
  ('Black', 'কালো', '#000000', 5),
  ('White', 'সাদা', '#FFFFFF', 6),
  ('Pink', 'গোলাপি', '#EC4899', 7),
  ('Purple', 'বেগুনি', '#A855F7', 8),
  ('Orange', 'কমলা', '#F97316', 9),
  ('Brown', 'বাদামি', '#A16207', 10),
  ('Navy', 'নেভি', '#1E3A5F', 11),
  ('Gray', 'ধূসর', '#6B7280', 12),
  ('Beige', 'বেইজ', '#D4C4A8', 13),
  ('Maroon', 'মেরুন', '#7F1D1D', 14);

-- Insert default sizes for clothing
INSERT INTO public.product_sizes (name, name_bn, category, display_order) VALUES
  ('XS', 'এক্সএস', 'clothing', 1),
  ('S', 'এস', 'clothing', 2),
  ('M', 'এম', 'clothing', 3),
  ('L', 'এল', 'clothing', 4),
  ('XL', 'এক্সএল', 'clothing', 5),
  ('XXL', 'এক্সএক্সএল', 'clothing', 6),
  ('Free Size', 'ফ্রি সাইজ', 'clothing', 7);

-- Insert sizes for accessories/general
INSERT INTO public.product_sizes (name, name_bn, category, display_order) VALUES
  ('Small', 'ছোট', 'general', 1),
  ('Medium', 'মাঝারি', 'general', 2),
  ('Large', 'বড়', 'general', 3);

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for variants
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;