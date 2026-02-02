-- Add banner and filter layout settings to shop_settings
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS filter_position VARCHAR(10) DEFAULT 'left' CHECK (filter_position IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS show_sales_banner BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sales_banner_position VARCHAR(10) DEFAULT 'top' CHECK (sales_banner_position IN ('top', 'bottom', 'left', 'right')),
ADD COLUMN IF NOT EXISTS sales_banner_text TEXT DEFAULT 'Big Sale! Up to 50% Off',
ADD COLUMN IF NOT EXISTS sales_banner_text_bn TEXT DEFAULT 'বিশাল ছাড়! ৫০% পর্যন্ত ছাড়',
ADD COLUMN IF NOT EXISTS sales_banner_link VARCHAR(500),
ADD COLUMN IF NOT EXISTS sales_banner_bg_color VARCHAR(50) DEFAULT '#C9A961',
ADD COLUMN IF NOT EXISTS sales_banner_text_color VARCHAR(50) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS show_promo_banner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_banner_position VARCHAR(10) DEFAULT 'right' CHECK (promo_banner_position IN ('top', 'bottom', 'left', 'right')),
ADD COLUMN IF NOT EXISTS promo_banner_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS promo_banner_link VARCHAR(500);