-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create enum for custom order status
CREATE TYPE public.custom_order_status AS ENUM ('pending', 'approved', 'rejected', 'in_production', 'completed');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('cod', 'bkash', 'nagad');

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_bn TEXT, -- Bangla name
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table with handmade features
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_bn TEXT, -- Bangla name
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    story TEXT, -- The making story
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2), -- For showing discounts
    stock_quantity INT DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images TEXT[] DEFAULT '{}', -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_preorderable BOOLEAN DEFAULT false, -- Can be pre-ordered when out of stock
    production_time TEXT, -- e.g., '7 days'
    allow_customization BOOLEAN DEFAULT false, -- Allow custom design upload
    materials TEXT, -- Materials used
    dimensions TEXT, -- Size/dimensions
    care_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom order requests table
CREATE TABLE public.custom_order_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reference_image_url TEXT NOT NULL, -- Stored in Supabase Storage
    description TEXT NOT NULL,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    status custom_order_status DEFAULT 'pending',
    admin_notes TEXT,
    estimated_price DECIMAL(10,2),
    estimated_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create addresses table for Bangladesh
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    division TEXT NOT NULL, -- বিভাগ
    district TEXT NOT NULL, -- জেলা
    thana TEXT NOT NULL, -- থানা/উপজেলা
    address_line TEXT NOT NULL, -- Full address
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    payment_transaction_id TEXT, -- For bKash/Nagad
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    is_preorder BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Store name at time of order
    product_price DECIMAL(10,2) NOT NULL, -- Store price at time of order
    quantity INT NOT NULL DEFAULT 1,
    is_preorder BOOLEAN DEFAULT false,
    customization_details JSONB, -- Store custom instructions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart table
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    customization_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Create wishlist table
CREATE TABLE public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories: Public read access
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Products: Public read access for active products
CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true);

-- Custom Order Requests: Users can manage their own requests
CREATE POLICY "Users can view own custom orders" ON public.custom_order_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create custom orders" ON public.custom_order_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom orders" ON public.custom_order_requests FOR UPDATE USING (auth.uid() = user_id);

-- Addresses: Users can manage their own addresses
CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view items from their orders
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Cart: Users can manage their own cart
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove from cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Wishlist: Users can manage their own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from wishlist" ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- Reviews: Public read for approved, users manage their own
CREATE POLICY "Approved reviews are public" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_order_requests_updated_at BEFORE UPDATE ON public.custom_order_requests 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ART-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Create storage bucket for custom designs
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-designs', 'custom-designs', true);

-- Storage policies for custom-designs bucket
CREATE POLICY "Anyone can view custom designs" ON storage.objects FOR SELECT USING (bucket_id = 'custom-designs');
CREATE POLICY "Authenticated users can upload designs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'custom-designs' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own designs" ON storage.objects FOR UPDATE USING (bucket_id = 'custom-designs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own designs" ON storage.objects FOR DELETE USING (bucket_id = 'custom-designs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample categories
INSERT INTO public.categories (name, name_bn, slug, description, display_order) VALUES
('Jewelry', 'গয়না', 'jewelry', 'হাতে তৈরি সোনালি ও রূপালি গয়না', 1),
('Bags & Accessories', 'ব্যাগ ও এক্সেসরিজ', 'bags-accessories', 'হাতে আঁকা ব্যাগ এবং স্কার্ফ', 2),
('Woven Tales', 'বুনন শিল্প', 'woven-tales', 'ক্রোশে, ম্যাক্রামে এবং হ্যান্ডলুম', 3),
('Fine Art', 'চারুকলা', 'fine-art', 'পেইন্টিং এবং শোপিস', 4);

-- Insert sample products
INSERT INTO public.products (name, name_bn, slug, description, story, price, stock_quantity, is_active, is_featured, is_new_arrival, is_preorderable, production_time, allow_customization, materials, category_id) VALUES
('Golden Leaf Necklace', 'সোনালি পাতার নেকলেস', 'golden-leaf-necklace', 'একটি অনন্য হাতে তৈরি সোনালি পাতার নেকলেস', 'প্রতিটি পাতা হাতে খোদাই করা হয়েছে, প্রকৃতির সৌন্দর্যকে ধরে রাখতে।', 2500.00, 5, true, true, true, true, '৫-৭ দিন', true, 'ব্রাস, গোল্ড প্লেটিং', (SELECT id FROM public.categories WHERE slug = 'jewelry')),
('Hand-Painted Tote Bag', 'হাতে আঁকা টোট ব্যাগ', 'hand-painted-tote-bag', 'বাংলার ঐতিহ্যবাহী মোটিফ দিয়ে আঁকা', 'প্রতিটি ব্যাগ একজন শিল্পীর হাতে আঁকা, কোনো দুটি ব্যাগ একরকম নয়।', 3500.00, 3, true, true, true, true, '৭-১০ দিন', true, 'ক্যানভাস, ফেব্রিক পেইন্ট', (SELECT id FROM public.categories WHERE slug = 'bags-accessories')),
('Macramé Wall Hanging', 'ম্যাক্রামে ওয়াল হ্যাঙ্গিং', 'macrame-wall-hanging', 'সুন্দর বোহেমিয়ান স্টাইলের ওয়াল আর্ট', 'প্রাকৃতিক তুলার সুতা দিয়ে হাতে বোনা।', 4500.00, 2, true, false, true, true, '১০-১৪ দিন', true, 'প্রাকৃতিক তুলা', (SELECT id FROM public.categories WHERE slug = 'woven-tales')),
('Abstract Canvas Painting', 'বিমূর্ত ক্যানভাস পেইন্টিং', 'abstract-canvas-painting', 'মনের ভাবনার রঙিন প্রকাশ', 'প্রতিটি স্ট্রোক শিল্পীর আবেগের প্রতিফলন।', 8500.00, 1, true, true, false, true, '১৪-২১ দিন', false, 'ক্যানভাস, এক্রিলিক পেইন্ট', (SELECT id FROM public.categories WHERE slug = 'fine-art'));
