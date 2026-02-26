# Artistiya E-Commerce: সম্পূর্ণ মাইগ্রেশন ডকুমেন্টেশন

## 📁 ফাইল তালিকা

| ফাইল | বিবরণ |
|------|--------|
| `DATABASE_SCHEMA_MYSQL.sql` | সম্পূর্ণ MySQL 8.0+ স্কিমা — ৫৫টি টেবিল, ১টি ভিউ, ৪টি ফাংশন, ৬টি ট্রিগার, ২টি প্রসিডিওর |
| `PHP_MIGRATION_GUIDE.md` | PHP/MySQL মাইগ্রেশন গাইড — API, পেমেন্ট, ডেলিভারি, Auth, ফাইল আপলোড |
| `SECURITY_HARDENING_GUIDE.md` | SQLi, XSS, CSRF প্রতিরোধ, AES-256, OWASP Top 10 |
| `FRONTEND_MIGRATION_GUIDE.md` | **ফ্রন্টএন্ড Supabase SDK → PHP API রিপ্লেসমেন্ট গাইড** — ১২৮ ফাইলের সম্পূর্ণ ম্যাপিং, Auth, Storage, Edge Functions |

## 🔄 Supabase → MySQL/PHP সম্পূর্ণ প্যারিটি

### টেবিল ম্যাপিং (৫৫টি)

| Supabase Table | MySQL Table | নোট |
|---------------|-------------|------|
| auth.users | users | password_hash, raw_user_meta_data যোগ |
| user_roles | user_roles | অপরিবর্তিত |
| profiles | profiles | অপরিবর্তিত |
| categories | categories | অপরিবর্তিত |
| products | products | text[] → JSON |
| product_variants | product_variants | text[] → JSON |
| product_colors | product_colors | অপরিবর্তিত |
| product_sizes | product_sizes | অপরিবর্তিত |
| collections | collections | অপরিবর্তিত |
| collection_products | collection_products | নতুন (join table) |
| addresses | addresses | অপরিবর্তিত |
| orders | orders | ENUM status/payment |
| order_items | order_items | অপরিবর্তিত |
| cart_items | cart_items | অপরিবর্তিত |
| payment_providers | payment_providers | অপরিবর্তিত |
| payment_transactions | payment_transactions | অপরিবর্তিত |
| promo_codes | promo_codes | text[] → JSON |
| promo_code_usage | promo_code_usage | অপরিবর্তিত |
| customer_discount_credits | customer_discount_credits | অপরিবর্তিত |
| qr_discount_settings | qr_discount_settings | ✅ নতুন যোগ |
| delivery_zones | delivery_zones | অপরিবর্তিত |
| delivery_partners | delivery_partners | অপরিবর্তিত |
| delivery_providers | delivery_providers | অপরিবর্তিত |
| checkout_settings | checkout_settings | অপরিবর্তিত |
| checkout_fraud_settings | checkout_fraud_settings | অপরিবর্তিত |
| blocked_customers | blocked_customers | অপরিবর্তিত |
| order_fraud_flags | order_fraud_flags | অপরিবর্তিত |
| abandoned_carts | abandoned_carts | অপরিবর্তিত |
| reviews | reviews | অপরিবর্তিত |
| product_reviews | product_reviews | অপরিবর্তিত |
| testimonials | testimonials | অপরিবর্তিত |
| hero_slides | hero_slides | অপরিবর্তিত |
| featured_sections | featured_sections | text[] → JSON |
| making_section | making_section | অপরিবর্তিত |
| homepage_content | homepage_content | অপরিবর্তিত |
| homepage_sections | homepage_sections | অপরিবর্তিত |
| content_pages | content_pages | অপরিবর্তিত |
| faq_items | faq_items | অপরিবর্তিত |
| blog_categories | blog_categories | অপরিবর্তিত |
| blog_posts | blog_posts | অপরিবর্তিত |
| blog_settings | blog_settings | অপরিবর্তিত |
| gallery_albums | gallery_albums | অপরিবর্তিত |
| gallery_items | gallery_items | অপরিবর্তিত |
| instagram_posts | instagram_posts | অপরিবর্তিত |
| youtube_videos | youtube_videos | অপরিবর্তিত |
| certifications | certifications | অপরিবর্তিত |
| menu_items | menu_items | অপরিবর্তিত |
| menu_sub_items | menu_sub_items | text[] → JSON |
| footer_link_groups | footer_link_groups | অপরিবর্তিত |
| footer_links | footer_links | অপরিবর্তিত |
| site_branding | site_branding | অপরিবর্তিত |
| site_settings | site_settings | ✅ নতুন যোগ |
| site_integrations | site_integrations | ✅ নতুন যোগ |
| shop_page_settings | shop_page_settings | ✅ নতুন যোগ |
| theme_settings | theme_settings | অপরিবর্তিত |
| category_display_settings | category_display_settings | অপরিবর্তিত |
| shop_settings | shop_settings | অপরিবর্তিত |
| filter_settings | filter_settings | অপরিবর্তিত |
| email_settings | email_settings | অপরিবর্তিত |
| email_templates | email_templates | অপরিবর্তিত |
| notifications | notifications | অপরিবর্তিত |
| announcement_bar | announcement_bar | অপরিবর্তিত |
| newsletter_settings | newsletter_settings | অপরিবর্তিত |
| newsletter_subscribers | newsletter_subscribers | অপরিবর্তিত |
| leads | leads | অপরিবর্তিত |
| customers | customers | UNIQUE(user_id) যোগ |
| crm_reports | crm_reports | অপরিবর্তিত |
| custom_order_requests | custom_order_requests | ENUM status |
| customization_settings | customization_settings | অপরিবর্তিত |
| wishlist_items | wishlist_items | অপরিবর্তিত |
| product_bundles | product_bundles | অপরিবর্তিত |
| bundle_products | bundle_products | অপরিবর্তিত |
| upsell_offers | upsell_offers | ✅ সঠিক কলাম যোগ |
| team_members | team_members | ✅ নতুন যোগ |
| invoice_settings | invoice_settings | অপরিবর্তিত |

### ফাংশন ম্যাপিং

| Supabase Function | MySQL Equivalent | ব্যবহার |
|-------------------|-----------------|---------|
| `is_admin(uuid)` | `is_admin(CHAR(36))` | Admin role check |
| `can_submit_lead(email, phone)` | `can_submit_lead(VARCHAR, VARCHAR)` | Rate limit leads |
| `can_subscribe_newsletter(email)` | `can_subscribe_newsletter(VARCHAR)` | Duplicate prevention |
| `generate_order_number()` | `generate_order_number()` | ART-YYYYMMDD-XXXX format |
| `encrypt_credential_value()` | `encrypt_credential_value()` PROCEDURE | AES-256 encryption |
| `decrypt_credential()` | `decrypt_credential()` PROCEDURE | AES-256 decryption |
| `encrypt_credential()` | N/A (app-layer) | Placeholder |

### ট্রিগার ম্যাপিং

| Supabase Trigger | MySQL Trigger | বিবরণ |
|-----------------|--------------|--------|
| `generate_order_number` | `trg_before_insert_orders` | Auto order number |
| `update_updated_at_column` | `trg_before_update_orders` | Auto updated_at |
| `check_order_fraud` | `trg_after_insert_orders_fraud` | Fraud scoring |
| `sync_customer_from_order` | `trg_after_insert_orders_customer` | Customer sync |
| `handle_new_user` | `trg_after_insert_users` | Auto profile creation |
| `update_customization_settings_updated_at` | `trg_before_update_customization` | Auto updated_at |

### ভিউ ম্যাপিং

| Supabase View | MySQL View | বিবরণ |
|--------------|-----------|--------|
| `public_site_branding` | `public_site_branding` | Sensitive fields বাদ |

### RLS → PHP Middleware ম্যাপিং

| Supabase RLS Policy | PHP Equivalent |
|---------------------|----------------|
| `is_admin(auth.uid())` | `Auth::isAdmin($userId)` middleware check |
| `auth.uid() = user_id` | JWT token → user_id match check |
| `is_active = true` (public read) | No auth needed, query adds `WHERE is_active = 1` |
| Rate limit policies | `RateLimit::check()` class |

### Storage Bucket ম্যাপিং

| Supabase Bucket | PHP Directory | Public |
|----------------|---------------|--------|
| `custom-designs` | `storage/uploads/custom-designs/` | Yes |
| `product-images` | `storage/uploads/product-images/` | Yes |
| `media` | `storage/uploads/media/` | Yes |
| `testimonials` | `storage/uploads/testimonials/` | Yes |

### Edge Function → PHP API ম্যাপিং

| Supabase Edge Function | PHP API File | বিবরণ |
|-----------------------|-------------|--------|
| `create-order` | `api/orders.php` | Server-side order creation |
| `sslcommerz-payment` | `api/payment-callback.php?gateway=sslcommerz` | SSLCommerz IPN |
| `bkash-payment` | `api/payment-callback.php?gateway=bkash` | bKash callback |
| `nagad-payment` | `api/payment-callback.php?gateway=nagad` | Nagad callback |
| `aamarpay-payment` | `api/payment-callback.php?gateway=aamarpay` | AamarPay IPN |
| `surjopay-payment` | `api/payment-callback.php?gateway=surjopay` | SurjoPay verify |
| `send-order-email` | `api/email.php` | Email sending via SMTP |
| `generate-invoice` | `api/invoice.php` | PDF invoice generation |
| `generate-delivery-slip` | `api/delivery-slip.php` | Delivery slip PDF |
| `delivery-api` | `api/delivery.php` | Courier API proxy |
| `encrypt-credentials` | PHP `Encryption` class | AES-256-GCM |
| `fetch-google-reviews` | `api/google-reviews.php` | Google Places API |

### Enum ম্যাপিং

| Supabase Enum | MySQL ENUM | মান |
|--------------|-----------|-----|
| `order_status` | `ENUM(...)` on orders.status | pending, confirmed, processing, shipped, delivered, cancelled |
| `payment_method` | `ENUM(...)` on orders.payment_method | cod, bkash, nagad, bank_transfer |
| `custom_order_status` | `ENUM(...)` on custom_order_requests.status | pending, approved, rejected, in_production, completed |

## 🚀 দ্রুত শুরু

```bash
# ১. MySQL-এ স্কিমা import (55 tables + views + functions + triggers)
mysql -u root -p artistiya_store < DATABASE_SCHEMA_MYSQL.sql

# ২. PHP প্রজেক্ট সেটআপ
composer init
cp .env.example .env

# ৩. Supabase থেকে ডেটা মাইগ্রেট
# PHP_MIGRATION_GUIDE.md দেখুন
```

## ✅ সম্পূর্ণ প্যারিটি চেকলিস্ট

- [x] ৫৫টি টেবিল (সকল Supabase টেবিল + PHP-specific)
- [x] ৬টি ট্রিগার (fraud detection, customer sync, auto profile)
- [x] ৪টি ফাংশন (is_admin, lead/newsletter rate limits, order number)
- [x] ২টি প্রসিডিওর (credential encrypt/decrypt)
- [x] ১টি ভিউ (public_site_branding)
- [x] ৩টি ENUM (order_status, payment_method, custom_order_status)
- [x] ৪টি Storage bucket equivalent
- [x] ১২টি Edge Function → PHP API equivalent
- [x] RLS → PHP middleware mapping
