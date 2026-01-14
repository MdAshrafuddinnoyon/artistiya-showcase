
-- Homepage CMS Content Table
CREATE TABLE public.homepage_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read active homepage content
CREATE POLICY "Anyone can view active homepage content"
ON public.homepage_content
FOR SELECT
USING (is_active = true);

-- Only admins can modify homepage content
CREATE POLICY "Admins can manage homepage content"
ON public.homepage_content
FOR ALL
USING (public.is_admin(auth.uid()));

-- Testimonials Table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  text TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  google_review_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (public.is_admin(auth.uid()));

-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (public.is_admin(auth.uid()));

-- Invoice Settings Table
CREATE TABLE public.invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  company_name TEXT DEFAULT 'artistiya.store',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  terms_and_conditions TEXT,
  footer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invoice settings"
ON public.invoice_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage invoice settings"
ON public.invoice_settings
FOR ALL
USING (public.is_admin(auth.uid()));

-- Filter Settings Table
CREATE TABLE public.filter_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filter_key TEXT NOT NULL UNIQUE,
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'checkbox',
  options JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.filter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active filters"
ON public.filter_settings
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage filters"
ON public.filter_settings
FOR ALL
USING (public.is_admin(auth.uid()));

-- Insert default homepage content
INSERT INTO public.homepage_content (section_key, content, display_order) VALUES
('hero', '{"badge": "Premium Handcrafted Collection", "title": "Artistry Woven,", "titleHighlight": "Elegance", "titleEnd": "Defined", "description": "Discover the artistry of handcrafted jewelry, hand-painted bags, and woven masterpieces. Each piece carries the legacy of Bengali craftsmanship.", "buttonText": "Shop Now", "buttonLink": "/shop", "secondaryButtonText": "View Collections", "secondaryButtonLink": "/collections", "backgroundImage": ""}', 1),
('categories', '{"badge": "Explore Our World", "title": "Shop by Category", "items": [{"name": "Jewelry", "description": "Exquisite handcrafted pieces", "href": "/shop/jewelry"}, {"name": "Hand-painted Bags", "description": "Wearable art pieces", "href": "/shop/bags"}, {"name": "Woven Tales", "description": "Crochet, Macramé & Handloom", "href": "/shop/woven"}, {"name": "Fine Art", "description": "Paintings & Showpieces", "href": "/shop/art"}]}', 2),
('featured', '{"badge": "Signature Collection", "title": "The Floral Bloom", "titleHighlight": "Tote Collection", "description": "Each bag in this collection is a canvas of nature''s beauty, hand-painted with meticulous attention to detail.", "features": ["100% Genuine Leather", "Hand-painted by skilled artisans", "Water-resistant coating", "Limited edition pieces"], "buttonText": "Explore Collection", "buttonLink": "/collections/floral-bloom", "priceText": "From ৳3,800"}', 3),
('making', '{"badge": "Our Craft", "title": "Every Piece Has a Story", "description": "Behind every creation lies hours of dedication, skill passed through generations, and an unwavering commitment to excellence.", "stats": [{"value": "2500+", "label": "Handcrafted Pieces"}, {"value": "50+", "label": "Skilled Artisans"}, {"value": "1000+", "label": "Happy Customers"}], "buttonText": "Learn Our Story", "buttonLink": "/about"}', 4),
('testimonials', '{"badge": "Customer Love", "title": "What Our Customers Say"}', 5),
('instagram', '{"badge": "Follow Our Journey", "title": "@artistiya.store", "instagramUrl": "https://instagram.com/artistiya.store"}', 6);

-- Insert default testimonials
INSERT INTO public.testimonials (name, location, text, rating, display_order) VALUES
('Fatima Rahman', 'Dhaka', 'The craftsmanship is absolutely stunning. My necklace gets compliments everywhere I go. You can truly feel the love and care put into each piece.', 5, 1),
('Ayesha Khan', 'Chittagong', 'I ordered a hand-painted bag as a gift for my mother. She was moved to tears by its beauty. artistiya.store has made a customer for life!', 5, 2),
('Nadia Ahmed', 'Sylhet', 'The macramé wall hanging transformed my living room. It''s not just decor, it''s a conversation starter. Exceptional quality!', 5, 3);

-- Insert default email templates
INSERT INTO public.email_templates (template_key, subject, html_content) VALUES
('order_confirmation', 'Order Confirmed - {{order_number}}', '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #D4AF37;">artistiya.store</h1></div><h2>Thank you for your order!</h2><p>Hi {{customer_name}},</p><p>Your order <strong>{{order_number}}</strong> has been confirmed.</p><div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">{{order_details}}</div><p><strong>Total: ৳{{total}}</strong></p><p>We will notify you when your order ships.</p><p>Thank you for shopping with us!</p><p>Best regards,<br>artistiya.store Team</p></body></html>'),
('order_shipped', 'Your Order Has Shipped - {{order_number}}', '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #D4AF37;">artistiya.store</h1></div><h2>Your order is on its way!</h2><p>Hi {{customer_name}},</p><p>Great news! Your order <strong>{{order_number}}</strong> has been shipped.</p><p>You can track your order using the link below:</p><p><a href="{{tracking_url}}" style="background: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Order</a></p><p>Thank you for your patience!</p><p>Best regards,<br>artistiya.store Team</p></body></html>'),
('order_delivered', 'Order Delivered - {{order_number}}', '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #D4AF37;">artistiya.store</h1></div><h2>Your order has been delivered!</h2><p>Hi {{customer_name}},</p><p>Your order <strong>{{order_number}}</strong> has been delivered.</p><p>We hope you love your purchase! If you have any questions or feedback, please don''t hesitate to reach out.</p><p><a href="{{review_url}}" style="background: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Leave a Review</a></p><p>Thank you for choosing artistiya.store!</p><p>Best regards,<br>artistiya.store Team</p></body></html>');

-- Insert default invoice settings
INSERT INTO public.invoice_settings (company_name, company_address, company_phone, company_email, terms_and_conditions, footer_note) VALUES
('artistiya.store', 'Dhaka, Bangladesh', '+880 1XXXXXXXXX', 'hello@artistiya.store', '1. All items are handcrafted and may have slight variations.\n2. Returns accepted within 7 days of delivery.\n3. Custom orders are non-refundable.', 'Thank you for your purchase!');

-- Insert default filter settings
INSERT INTO public.filter_settings (filter_key, filter_name, filter_type, options, display_order) VALUES
('price_range', 'Price Range', 'range', '{"min": 0, "max": 50000}', 1),
('preorder', 'Pre-order Available', 'toggle', '{}', 2);

-- Add triggers for updated_at
CREATE TRIGGER update_homepage_content_updated_at
BEFORE UPDATE ON public.homepage_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
