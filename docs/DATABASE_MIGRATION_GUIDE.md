# ডাটাবেস মাইগ্রেশন গাইড | Database Migration Guide

এই গাইডটি আপনার অ্যাপ্লিকেশনের ডাটাবেস অন্য প্ল্যাটফর্মে (যেমন: Hostinger, DigitalOcean, AWS RDS, Railway) মাইগ্রেট করার জন্য।

---

## 📋 সূচিপত্র

1. [প্রয়োজনীয়তা](#প্রয়োজনীয়তা)
2. [বর্তমান Supabase থেকে এক্সপোর্ট](#বর্তমান-supabase-থেকে-এক্সপোর্ট)
3. [নতুন ডাটাবেসে ইম্পোর্ট](#নতুন-ডাটাবেসে-ইম্পোর্ট)
4. [Hostinger-এ মাইগ্রেশন](#hostinger-এ-মাইগ্রেশন)
5. [অ্যাপ্লিকেশন কনফিগারেশন আপডেট](#অ্যাপ্লিকেশন-কনফিগারেশন-আপডেট)
6. [নিরাপত্তা বিবেচনা](#নিরাপত্তা-বিবেচনা)

---

## প্রয়োজনীয়তা

- PostgreSQL 14+ (প্রোডাকশনের জন্য প্রস্তাবিত)
- `pg_dump` এবং `psql` CLI টুলস
- নতুন হোস্টের ডাটাবেস ক্রেডেনশিয়াল
- SSL সার্টিফিকেট (প্রোডাকশনের জন্য প্রয়োজনীয়)

---

## বর্তমান Supabase থেকে এক্সপোর্ট

### ধাপ ১: স্কিমা এক্সপোর্ট

```bash
# Supabase CLI দিয়ে স্কিমা এক্সপোর্ট
supabase db dump --schema public --file schema.sql

# অথবা pg_dump ব্যবহার করে
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f schema_export.sql
```

### ধাপ ২: ডাটা এক্সপোর্ট

```bash
# সম্পূর্ণ ডাটা এক্সপোর্ট
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  -f data_export.sql

# নির্দিষ্ট টেবিল এক্সপোর্ট (ঐচ্ছিক)
pg_dump "postgresql://..." \
  --table=products \
  --table=categories \
  --table=orders \
  -f selected_tables.sql
```

### ধাপ ৩: Storage ফাইল এক্সপোর্ট

```bash
# Supabase Storage থেকে ফাইল ডাউনলোড
# product-images, media, testimonials, custom-designs buckets

# স্ক্রিপ্ট ব্যবহার করে:
node scripts/export-storage.js
```

---

## নতুন ডাটাবেসে ইম্পোর্ট

### ধাপ ১: ডাটাবেস তৈরি

```sql
-- নতুন ডাটাবেস তৈরি
CREATE DATABASE artisan_shop;

-- প্রয়োজনীয় extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### ধাপ ২: স্কিমা ইম্পোর্ট

```bash
psql -h [HOST] -U [USER] -d artisan_shop -f schema_export.sql
```

### ধাপ ৩: ডাটা ইম্পোর্ট

```bash
psql -h [HOST] -U [USER] -d artisan_shop -f data_export.sql
```

---

## Hostinger-এ মাইগ্রেশন

### Hostinger MySQL ব্যবহার করলে

⚠️ **সতর্কতা**: এই অ্যাপ্লিকেশন PostgreSQL-এর জন্য ডিজাইন করা। MySQL-এ মাইগ্রেট করতে হলে:

1. **স্কিমা রূপান্তর প্রয়োজন**
   - `uuid` → `CHAR(36)` বা `BINARY(16)`
   - `jsonb` → `JSON`
   - `text[]` → আলাদা টেবিল
   - PostgreSQL-specific functions রিরাইট

2. **প্রস্তাবিত বিকল্প**: Hostinger VPS নিন এবং PostgreSQL ইনস্টল করুন

### Hostinger VPS-এ PostgreSQL

```bash
# 1. SSH দিয়ে কানেক্ট
ssh root@your-vps-ip

# 2. PostgreSQL ইনস্টল
apt update
apt install postgresql postgresql-contrib

# 3. ডাটাবেস সেটআপ
sudo -u postgres createuser --interactive
sudo -u postgres createdb artisan_shop

# 4. Remote access enable
nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = '*'

nano /etc/postgresql/14/main/pg_hba.conf
# host all all 0.0.0.0/0 md5

# 5. রিস্টার্ট
systemctl restart postgresql

# 6. ফায়ারওয়াল
ufw allow 5432/tcp
```

---

## অ্যাপ্লিকেশন কনফিগারেশন আপডেট

### ১. Environment Variables

```env
# .env ফাইল আপডেট করুন

# Supabase থেকে সরাসরি PostgreSQL-এ সুইচ করতে:
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/artisan_shop

# অথবা নতুন Supabase প্রজেক্টে পয়েন্ট করুন:
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
```

### ২. কোড পরিবর্তন (যদি Supabase ছাড়া PostgreSQL ব্যবহার করেন)

```typescript
// src/lib/db.ts - নতুন ফাইল তৈরি করুন
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Query helper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

### ৩. Edge Functions মাইগ্রেশন

Edge functions Deno-তে লেখা। সেগুলো:
- **Supabase Edge Functions** - যেমন আছে রাখুন
- **অন্য হোস্ট** - Node.js/Express API-এ কনভার্ট করুন

```javascript
// Express.js উদাহরণ
const express = require('express');
const app = express();

app.post('/api/send-order-email', async (req, res) => {
  // Edge function লজিক এখানে
});
```

---

## নিরাপত্তা বিবেচনা

### ১. RLS (Row Level Security)

Supabase-এর বাইরে RLS কাজ করবে না। বিকল্প:

```typescript
// Application-level authorization
async function getOrders(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return await query('SELECT * FROM orders');
  }
  return await query('SELECT * FROM orders WHERE user_id = $1', [userId]);
}
```

### ২. Credential Encryption

বর্তমান এনক্রিপশন সিস্টেম:
- `CREDENTIALS_ENCRYPTION_KEY` secret ব্যবহার হয়
- Payment, delivery, email credentials encrypted

নতুন হোস্টে:
```bash
# নতুন encryption key জেনারেট
openssl rand -base64 32

# Environment variable হিসেবে সেট করুন
export CREDENTIALS_ENCRYPTION_KEY="your-new-key"
```

### ৩. SSL/TLS

```bash
# Let's Encrypt SSL (VPS-এর জন্য)
apt install certbot
certbot certonly --standalone -d your-domain.com
```

---

## ডাটাবেস টেবিল রেফারেন্স

### সম্পূর্ণ টেবিল লিস্ট (৭৫+ টেবিল):

#### 🛒 প্রোডাক্ট ম্যানেজমেন্ট
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `products` | পণ্য তালিকা | name, price, images, stock_quantity |
| `categories` | ক্যাটাগরি | name, slug, image_url, parent_id |
| `collections` | কালেকশন | name, slug, image_url |
| `product_variants` | ভ্যারিয়েন্ট | product_id, sku, price, stock |
| `product_colors` | রঙ | product_id, color_name, color_code |
| `product_sizes` | সাইজ | product_id, size_name |
| `product_bundles` | বান্ডল | name, discount_type, discount_value |
| `bundle_products` | বান্ডল আইটেম | bundle_id, product_id |

#### 📦 অর্ডার ম্যানেজমেন্ট
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `orders` | অর্ডার | order_number, status, total |
| `order_items` | অর্ডার আইটেম | order_id, product_id, quantity |
| `addresses` | ঠিকানা | full_name, phone, division, district |
| `delivery_zones` | ডেলিভারি জোন | division, district, shipping_cost |
| `delivery_partners` | কুরিয়ার পার্টনার | name, api_key, is_active |
| `delivery_providers` | ডেলিভারি প্রোভাইডার | provider_type, config |
| `abandoned_carts` | পরিত্যক্ত কার্ট | user_id, cart_data, cart_total |

#### 💳 পেমেন্ট
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `payment_providers` | পেমেন্ট গেটওয়ে | name, provider_type, is_active |
| `promo_codes` | প্রোমো কোড | code, discount_type, discount_value |
| `customer_discount_credits` | কাস্টমার ক্রেডিট | user_id, discount_value |

#### 👥 ইউজার ও CRM
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `profiles` | ইউজার প্রোফাইল | user_id, full_name, avatar_url |
| `user_roles` | অ্যাডমিন রোল | user_id, role |
| `customers` | কাস্টমার CRM | email, total_orders, total_spent |
| `blocked_customers` | ব্লক কাস্টমার | phone, email, block_reason |
| `cart_items` | কার্ট | user_id, product_id, quantity |
| `wishlist_items` | উইশলিস্ট | user_id, product_id |
| `custom_order_requests` | কাস্টম অর্ডার | description, reference_image_url |
| `product_reviews` | রিভিউ | product_id, rating, comment |

#### 🎨 CMS
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `hero_slides` | হিরো ব্যানার | title, image_url, button_link |
| `homepage_sections` | হোমপেজ সেকশন | section_type, config, display_order |
| `homepage_content` | হোমপেজ কন্টেন্ট | section_key, content |
| `featured_sections` | ফিচার্ড সেকশন | title, image_url, features |
| `blog_posts` | ব্লগ পোস্ট | title, content, slug |
| `blog_categories` | ব্লগ ক্যাটাগরি | name, slug |
| `blog_settings` | ব্লগ সেটিংস | posts_per_page, show_banner |
| `faq_items` | FAQ | question, answer, category |
| `testimonials` | টেস্টিমোনিয়াল | name, rating, comment |
| `gallery_albums` | গ্যালারি অ্যালবাম | title, cover_image_url |
| `gallery_items` | গ্যালারি আইটেম | album_id, media_url |
| `instagram_posts` | ইনস্টাগ্রাম | image_url, caption, link_url |
| `youtube_videos` | ইউটিউব | video_id, title |
| `certifications` | সার্টিফিকেট | title, file_url |
| `content_pages` | স্ট্যাটিক পেজ | page_key, title, content |
| `announcement_bar` | অ্যানাউন্সমেন্ট | message, background_color |
| `team_members` | টিম মেম্বার | name, role, image_url |

#### ⚙️ সেটিংস
| টেবিল | বর্ণনা | প্রধান ফিল্ড |
|-------|--------|-------------|
| `site_branding` | ব্র্যান্ডিং | logo_url, footer_description |
| `theme_settings` | থিম | primary_color, font_family |
| `shop_settings` | শপ সেটিংস | products_per_page, default_sort |
| `checkout_settings` | চেকআউট | cod_enabled, free_shipping_threshold |
| `checkout_fraud_settings` | ফ্রড সেটিংস | max_orders_per_phone |
| `email_settings` | ইমেইল | provider, from_email |
| `email_templates` | ইমেইল টেমপ্লেট | template_key, html_content |
| `invoice_settings` | ইনভয়েস | company_name, logo_url |
| `newsletter_settings` | নিউজলেটার | title, subtitle |
| `newsletter_subscribers` | সাবস্ক্রাইবার | email, source |
| `filter_settings` | ফিল্টার | filter_key, options |
| `currency_rates` | কারেন্সি | currency_code, rate_to_bdt |
| `category_display_settings` | ক্যাটাগরি ডিসপ্লে | columns_desktop, enable_slider |
| `footer_link_groups` | ফুটার গ্রুপ | title, display_order |
| `footer_links` | ফুটার লিংক | group_id, name, href |
| `social_links` | সোশ্যাল লিংক | platform, url |
| `marketing_settings` | মার্কেটিং | google_analytics_id |
| `google_integrations` | গুগল | place_id, reviews_enabled |
| `upsell_offers` | আপসেল | trigger_type, offer_text |
| `crm_reports` | CRM রিপোর্ট | report_type, data |

### গুরুত্বপূর্ণ সম্পর্ক:
```sql
orders.address_id → addresses.id
order_items.order_id → orders.id
order_items.product_id → products.id
products.category_id → categories.id
categories.parent_id → categories.id
user_roles.user_id → auth.users.id
customers.user_id → auth.users.id
```

---

## ডাটাবেস সুইচ করার পদ্ধতি

### Supabase থেকে অন্য Supabase-এ

```bash
# ১. পুরাতন প্রজেক্ট থেকে এক্সপোর্ট
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_REF].supabase.co:5432/postgres" \
  --no-owner --no-privileges -f full_backup.sql

# ২. নতুন প্রজেক্টে ইম্পোর্ট
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres" \
  -f full_backup.sql

# ৩. .env আপডেট
VITE_SUPABASE_URL=https://new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=new-anon-key
VITE_SUPABASE_PROJECT_ID=new-project-id
```

### Lovable Cloud থেকে Self-Hosted

```bash
# ১. Lovable Cloud থেকে credentials নিন
# Cloud View → Settings → Connection Info

# ২. pg_dump দিয়ে এক্সপোর্ট
pg_dump "postgresql://..." -f lovable_backup.sql

# ৩. নতুন সার্ভারে PostgreSQL সেটআপ
createdb artisan_shop
psql -d artisan_shop -f lovable_backup.sql

# ৪. Storage ফাইল মাইগ্রেট (S3/Cloudflare R2)
# node scripts/migrate-storage.js

# ৫. কোড আপডেট (Supabase SDK → pg/Node)
```

---

## টেস্ট রেজাল্ট (সর্বশেষ আপডেট: ২০২৬-০২-০৮)

### ✅ সফল পরীক্ষাগুলো:

| ফিচার | স্ট্যাটাস | নোট |
|--------|---------|------|
| প্রোডাক্ট CRUD | ✅ সফল | 11 সক্রিয় প্রোডাক্ট |
| ক্যাটাগরি ম্যানেজমেন্ট | ✅ সফল | 6 ক্যাটাগরি |
| অর্ডার সিস্টেম | ✅ সফল | 2 অর্ডার |
| হোমপেজ সেকশন | ✅ সফল | 7 সক্রিয় সেকশন |
| রিয়েলটাইম সিঙ্ক | ✅ সফল | সব টেবিলে কাজ করছে |
| অ্যাডমিন RLS | ✅ সফল | is_admin() ফাংশন |
| মোবাইল/ডেস্কটপ সিঙ্ক | ✅ সফল | ফুটার ফলব্যাক ফিক্সড |
| ইমেজ স্টোরেজ | ✅ সফল | 4 বাকেট সক্রিয় |
| CRM ড্যাশবোর্ড | ✅ সফল | ফিল্টার ও এক্সপোর্ট |

### Storage Buckets:
- `product-images` (public) - প্রোডাক্ট ছবি
- `media` (public) - সাধারণ মিডিয়া
- `testimonials` (public) - কাস্টমার ফটো
- `custom-designs` (public) - কাস্টম অর্ডার রেফারেন্স

---

## চেকলিস্ট

- [x] স্কিমা এক্সপোর্ট সম্পন্ন
- [x] ডাটা এক্সপোর্ট সম্পন্ন
- [x] Storage ফাইল ব্যাকআপ
- [x] রিয়েলটাইম সিঙ্ক ডকুমেন্টেশন
- [x] ফুটার ফলব্যাক লজিক ফিক্স
- [ ] নতুন ডাটাবেস তৈরি
- [ ] Extensions ইনস্টল
- [ ] স্কিমা ইম্পোর্ট
- [ ] ডাটা ইম্পোর্ট
- [ ] Environment variables আপডেট
- [ ] SSL কনফিগার
- [ ] Application-level security ইমপ্লিমেন্ট
- [ ] Edge functions কনভার্ট (যদি প্রয়োজন)
- [ ] Storage সলিউশন সেটআপ
- [ ] টেস্টিং সম্পন্ন
- [ ] DNS আপডেট

---

## সম্পর্কিত ডকুমেন্টেশন

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - সম্পূর্ণ ফিচার লিস্ট ও আর্কিটেকচার
- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - সিকিউরিটি কনফিগারেশন
- [MOBILE_LAYOUT_GUIDE.md](./MOBILE_LAYOUT_GUIDE.md) - মোবাইল রেসপন্সিভ গাইড

---

## সহায়তা

সমস্যা হলে:
1. PostgreSQL logs চেক করুন
2. Connection string যাচাই করুন
3. Firewall rules পরীক্ষা করুন
4. SSL certificates যাচাই করুন

---

*শেষ আপডেট: ২০২৬-০২-০৮*
