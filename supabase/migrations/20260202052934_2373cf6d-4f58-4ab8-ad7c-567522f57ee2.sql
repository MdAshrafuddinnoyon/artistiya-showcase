-- Fix cart_items RLS policies to allow authenticated users to add items
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Create proper RLS policies for cart_items
CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also add images to existing demo products
UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=600&fit=crop'
] WHERE slug = '3d-resin-art-painting';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=600&fit=crop'
] WHERE slug = 'mini-landscape-canvas';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop'
] WHERE slug = 'colorful-polymer-clay-earrings';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600&h=600&fit=crop'
] WHERE slug = 'floral-polymer-stud-set';

UPDATE products SET images = ARRAY[
  'https://images.unsplash.com/photo-1601224861024-a61d57a83a84?w=600&h=600&fit=crop'
] WHERE slug = 'canvas-art-coaster-set';

-- Insert 3 new demo products with images
INSERT INTO products (name, name_bn, slug, price, compare_at_price, description, images, stock_quantity, is_active, is_featured, is_new_arrival, is_preorderable, production_time, materials, story)
VALUES 
(
  'Handwoven Jute Bag',
  'হাতে বোনা পাটের ব্যাগ',
  'handwoven-jute-bag',
  1200.00,
  1500.00,
  'Traditional Bangladeshi jute handwoven bag, eco-friendly and durable.',
  ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
  20,
  true,
  true,
  true,
  false,
  NULL,
  'প্রাকৃতিক পাট, কটন লাইনিং',
  'বাংলাদেশের ঐতিহ্যবাহী পাটশিল্পের আধুনিক রূপ।'
),
(
  'Ceramic Tea Set',
  'সিরামিক চা সেট',
  'ceramic-tea-set',
  2500.00,
  3000.00,
  'Handcrafted ceramic tea set with traditional Bengali motifs, includes teapot and 4 cups.',
  ARRAY['https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop'],
  10,
  true,
  true,
  true,
  true,
  '৭-১০ দিন',
  'উচ্চমানের সিরামিক',
  'প্রতিটি পিস হাতে তৈরি এবং রঙ করা।'
),
(
  'Brass Home Decor Lamp',
  'পিতলের হোম ডেকর ল্যাম্প',
  'brass-home-decor-lamp',
  3500.00,
  4200.00,
  'Elegant handcrafted brass lamp with intricate Bengali design patterns.',
  ARRAY['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop'],
  5,
  true,
  true,
  true,
  true,
  '১০-১৪ দিন',
  'হাতে তৈরি পিতল',
  'ঐতিহ্যবাহী বাংলা কারুশিল্পের নিদর্শন।'
)
ON CONFLICT (slug) DO UPDATE SET
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  is_active = true;