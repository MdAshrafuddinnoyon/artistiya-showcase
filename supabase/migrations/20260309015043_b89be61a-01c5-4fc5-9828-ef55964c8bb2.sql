-- Insert payment banner
INSERT INTO footer_payment_banners (name, image_url, link_url, display_order, is_active)
VALUES ('All Payment Methods', 'https://dacbflyswlopvexyouam.supabase.co/storage/v1/object/public/product-images/payment-logos/all-payments-banner.png', NULL, 0, true);

-- Update payment label
UPDATE site_branding 
SET footer_payment_label = 'Pay With', 
    footer_payment_label_bn = 'পেমেন্ট করুন'
WHERE id = (SELECT id FROM site_branding LIMIT 1);