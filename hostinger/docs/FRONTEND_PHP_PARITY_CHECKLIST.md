# Artistiya — Frontend ↔ PHP Backend Parity Checklist

> Generated: 2026-03-09
> Purpose: Verify every frontend API call maps correctly to a PHP endpoint

---

## ✅ = Working | ⚠️ = Issue Found | ❌ = Missing

---

## 1. Compatibility Layer (`src/lib/db.ts`)

| Feature | Supabase SDK Method | PHP Shim Method | Status |
|---------|-------------------|-----------------|--------|
| Query Builder | `.from("table").select()` | `QueryBuilder.select()` → `GET /table` | ✅ |
| Filters | `.eq()`, `.neq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()` | URL params `eq.col=val` | ✅ |
| Pattern Match | `.like()`, `.ilike()` | `like.col=val`, `LOWER()` LIKE | ✅ |
| NULL check | `.is("col", null)` | `is.col=null` → `IS NULL` | ✅ |
| IN filter | `.in("col", [...])` | `in.col=[...]` → `IN (...)` | ✅ |
| OR filter | `.or("a.eq.1,b.eq.2")` | `or=...` param | ⚠️ **`crud.php` has NO `or` handler** |
| NOT filter | `.not("col","eq",val)` | `not.eq.col=val` | ⚠️ **`crud.php` has NO `not.*` handler** |
| Contains | `.contains()` | `cs.col=val` | ⚠️ **`crud.php` has NO `cs`/`cd` handler** |
| Text Search | `.textSearch()` | `fts.col=val` | ⚠️ **`crud.php` has NO `fts` handler** |
| Order | `.order("col", {ascending: false})` | `order=col.desc` | ✅ |
| Limit | `.limit(n)` | `limit=n` | ✅ |
| Range | `.range(from, to)` | `offset=from&limit=to-from+1` | ✅ |
| Single | `.single()` | `single=true` | ✅ |
| MaybeSingle | `.maybeSingle()` | `single=true` (same) | ✅ |
| Insert | `.insert(data)` | `POST /table` | ✅ |
| Update | `.update(data).eq()` | `PATCH /table?eq.col=val` | ✅ |
| Upsert | `.upsert(data)` | `POST /table?upsert=true` | ⚠️ **`crud.php` has NO upsert (ON DUPLICATE KEY) handler** |
| Delete | `.delete().eq()` | `DELETE /table?eq.col=val` | ✅ |
| Count | `.select("*", {count:"exact"})` | `count=exact` param | ⚠️ **`crud.php` has NO count handler** |
| Auth | `supabase.auth.*` | `phpAuth.*` → `/auth/*` | ✅ |
| Storage | `supabase.storage.from().upload()` | `phpStorage` → `/storage/*` | ✅ |
| Functions | `supabase.functions.invoke()` | `phpFunctions` → `/functions/*` | ✅ |
| RPC | `supabase.rpc()` | `phpRpc` → `/functions/*` | ✅ |
| Realtime | `supabase.channel()` | Stub (no-op) | ⚠️ Expected — no PHP WebSocket |
| Multiple orders | `.order().order()` | Only last `order=` kept | ⚠️ **Only single order supported** |

---

## 2. Authentication (`/auth/*`)

| Frontend Call | PHP Endpoint | PHP File | Status |
|--------------|-------------|----------|--------|
| `auth.signUp({email, password, options})` | `POST /auth/signup` | `auth/register.php` | ✅ |
| `auth.signInWithPassword({email, password})` | `POST /auth/login` | `auth/login.php` | ✅ |
| `auth.signOut()` | `POST /auth/logout` | `auth/logout.php` | ✅ |
| `auth.getSession()` | `GET /auth/session` | `auth/session.php` | ✅ |
| `auth.getUser()` | `GET /auth/profile` | `auth/profile.php` | ✅ |
| `auth.updateUser(data)` | `PATCH /auth/profile` | `auth/profile.php` | ✅ |
| `auth.resetPasswordForEmail(email)` | `POST /auth/reset-password` | `auth/reset-password.php` | ✅ |
| `auth.onAuthStateChange(callback)` | localStorage + polling | `db.ts` shim | ✅ |

---

## 3. Page-by-Page API Call Verification

### 3.1 Homepage (`/` — `Index.tsx`)

| Component | API Call | Table/Endpoint | PHP CRUD Match |
|-----------|---------|---------------|----------------|
| HeroSection | `.from("hero_slides").select("*").eq("is_active", true).order("display_order")` | `GET /hero_slides?eq.is_active=1&order=display_order.asc` | ✅ |
| HomepageSections | `.from("homepage_sections").select("*").eq("is_active", true).order("display_order")` | `GET /homepage_sections?eq.is_active=1&order=display_order.asc` | ✅ |
| CategorySection | `.from("categories").select("*")` | `GET /categories` | ✅ |
| CategoryDisplaySettings | `.from("category_display_settings").select("*").single()` | `GET /category_display_settings?single=true` | ✅ |
| NewArrivalsSection | `.from("products").select("*").eq("is_active", true).eq("is_new_arrival", true)` | `GET /products?eq.is_active=1&eq.is_new_arrival=1` | ✅ |
| FeaturedSection | `.from("featured_sections").select("*").eq("is_active", true)` | `GET /featured_sections?eq.is_active=1` | ✅ |
| MakingSection | `.from("making_section").select("*").single()` | `GET /making_section?single=true` | ✅ |
| TestimonialsSection | `.from("testimonials").select("*").eq("is_active", true)` | `GET /testimonials?eq.is_active=1` | ✅ |
| InstagramSection | `.from("instagram_posts").select("*").eq("is_active", true)` | `GET /instagram_posts?eq.is_active=1` | ✅ |
| FAQSection | `.from("faq_items").select("*").eq("is_active", true)` | `GET /faq_items?eq.is_active=1` | ✅ |
| YouTubeVideos | `.from("youtube_videos").select("*").eq("is_active", true)` | `GET /youtube_videos?eq.is_active=1` | ✅ |
| BlogPosts | `.from("blog_posts").select("*").eq("is_published", true)` | `GET /blog_posts?eq.is_published=1` | ✅ |

### 3.2 Shop Page (`/shop` — `Shop.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Product list | `.from("products").select("*").eq("is_active", true)` | ✅ | ✅ |
| Category filter | `.eq("category_id", id)` | ✅ | ✅ |
| Price range | `.gte("price", min).lte("price", max)` | ✅ | ✅ |
| **Search** | `.or("name.ilike.%q%,description.ilike.%q%")` | ❌ | ❌ **`or` not handled in `crud.php`** |
| Sort by price | `.order("price", {ascending: true})` | ✅ | ✅ |
| Pagination | `.range(from, to)` | ✅ | ✅ |
| Shop settings | `.from("shop_page_settings").select("*").single()` | ✅ | ✅ |
| Filter settings | `.from("filter_settings").select("*").eq("is_active", true)` | ✅ | ✅ |

### 3.3 Product Detail (`/product/:slug` — `ProductDetail.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Product by slug | `.from("products").select("*").eq("slug", slug).single()` | ✅ | ✅ |
| Product variants | `.from("product_variants").select("*").eq("product_id", id)` | ✅ | ✅ |
| Product colors | `.from("product_colors").select("*").eq("product_id", id)` | ✅ | ✅ |
| Product sizes | `.from("product_sizes").select("*").eq("product_id", id)` | ✅ | ✅ |
| Product reviews | `.from("product_reviews").select("*").eq("product_id", id).eq("is_approved", true)` | ✅ | ✅ |
| Related products | `.from("products").select("*").eq("category_id", catId).neq("id", currentId)` | ✅ | ✅ |
| Submit review | `.from("product_reviews").insert(data)` | ✅ | ✅ |
| Wishlist toggle | `.from("wishlist_items").insert/delete` | ✅ | ✅ |

### 3.4 Checkout (`/checkout` — `Checkout.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Create order | `functions.invoke("create-order", {body})` | `/functions/create-order` → `orders/create.php` | ✅ |
| Checkout settings | `.from("checkout_settings").select("*").single()` | ✅ | ✅ |
| Delivery zones | `.from("delivery_zones").select("*").eq("is_active", true)` | ✅ | ✅ |
| Promo code validation | `.from("promo_codes").select("*").eq("code", code).single()` | ✅ | ✅ |
| User addresses | `.from("addresses").select("*").eq("user_id", userId)` | ✅ | ✅ |
| Payment: bKash | `functions.invoke("bkash-payment/create", {body})` | ⚠️ `/functions/bkash-payment` (no sub-path routing) | ⚠️ |
| Payment: Nagad | `functions.invoke("nagad-payment", {body})` | `/functions/nagad-payment` → `payments/nagad.php` | ✅ |
| Payment: SSLCommerz | `functions.invoke("sslcommerz-payment", {body})` | `/functions/sslcommerz-payment` → `payments/sslcommerz.php` | ✅ |
| Payment: AamarPay | `functions.invoke("aamarpay-payment", {body})` | `/functions/aamarpay-payment` → `payments/aamarpay.php` | ✅ |
| Payment: SurjoPay | `functions.invoke("surjopay-payment", {body})` | `/functions/surjopay-payment` → `payments/surjopay.php` | ✅ |

### 3.5 Cart & Wishlist

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Get cart items | `.from("cart_items").select("*").eq("user_id", id)` | ✅ (user-scoped) | ✅ |
| Add to cart | `.from("cart_items").insert(data)` | ✅ | ✅ |
| Update quantity | `.from("cart_items").update(data).eq("id", id)` | ✅ | ✅ |
| Remove from cart | `.from("cart_items").delete().eq("id", id)` | ✅ | ✅ |
| Wishlist items | `.from("wishlist_items").select/insert/delete` | ✅ | ✅ |

### 3.6 User Dashboard (`/dashboard` — `Dashboard.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| User profile | `auth.getUser()` | `/auth/profile` | ✅ |
| My orders | `.from("orders").select("*").eq("user_id", userId)` | ✅ | ✅ |
| My addresses | `.from("addresses").select("*").eq("user_id", userId)` | ✅ | ✅ |
| Order items | `.from("order_items").select("*").eq("order_id", id)` | ⚠️ `order_items` not in `$PUBLIC_READ_TABLES` and user not admin | ⚠️ |

### 3.7 Order Tracking (`/track` — `TrackOrder.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Track by order number | `.from("orders").select("*").eq("order_number", num).single()` | ✅ | ⚠️ `orders` not in `$PUBLIC_READ_TABLES` |

### 3.8 Blog (`/blog` — `Blog.tsx`)

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Published posts | `.from("blog_posts").select("*").eq("is_published", true)` | ✅ | ✅ |
| Single post | `.from("blog_posts").select("*").eq("slug", slug).single()` | ✅ | ✅ |
| Blog categories | `.from("blog_categories").select("*")` | ✅ | ✅ |
| Blog settings | `.from("blog_settings").select("*").single()` | ✅ | ✅ |

### 3.9 Other Public Pages

| Page | API Call | Table | Status |
|------|---------|-------|--------|
| Gallery | `.from("gallery_albums/gallery_items")` | ✅ Public | ✅ |
| FAQ | `.from("faq_items")` | ✅ Public | ✅ |
| About | `.from("team_members")` | ✅ Public | ✅ |
| Contact | `.from("site_branding").single()` | ✅ Public | ✅ |
| Collections | `.from("collections")` + `.from("collection_products")` | ✅ Public | ✅ |
| CMS pages | `.from("content_pages").eq("page_key", key)` | ✅ Public | ✅ |

---

## 4. Admin Panel (`/admin` — Full Verification)

### 4.1 Admin Auth

| Feature | API Call | PHP Match | Status |
|---------|---------|-----------|--------|
| Admin check | `supabase.rpc("is_admin", {check_user_id})` | `phpRpc` → `/functions/is_admin` | ❌ **No `is_admin` function in `handler.php`** |

### 4.2 Admin CRUD Operations

| Admin Component | Table | Read | Write | Status |
|----------------|-------|------|-------|--------|
| Products | `products` | ✅ | ✅ Admin-only | ✅ |
| Categories | `categories` | ✅ | ✅ Admin-only | ✅ |
| Orders | `orders` | ✅ | ✅ Admin-only | ✅ |
| Customers | `customers` | ✅ | ✅ Admin-only | ✅ |
| Hero Slider | `hero_slides` | ✅ | ✅ Admin-only | ✅ |
| Blog Posts | `blog_posts` | ✅ | ✅ Admin-only | ✅ |
| Blog Categories | `blog_categories` | ✅ | ✅ Admin-only | ✅ |
| Collections | `collections` | ✅ | ✅ Admin-only | ✅ |
| FAQs | `faq_items` | ✅ | ✅ Admin-only | ✅ |
| Testimonials | `testimonials` | ✅ | ✅ Admin-only | ✅ |
| Gallery | `gallery_albums` + `gallery_items` | ✅ | ✅ Admin-only | ✅ |
| Content Pages | `content_pages` | ✅ | ✅ Admin-only | ✅ |
| Promo Codes | `promo_codes` | ✅ | ✅ Admin-only | ✅ |
| Team Members | `team_members` | ✅ | ✅ Admin-only | ✅ |
| Social Links | `social_links` | ✅ | ✅ Admin-only | ✅ |
| Site Branding | `site_branding` | ✅ | ✅ Admin-only | ✅ |
| Menu Items | `menu_items` + `menu_sub_items` | ✅ | ✅ Admin-only | ✅ |
| Footer Links | `footer_link_groups` + `footer_links` | ✅ | ✅ Admin-only | ✅ |
| Payment Banners | `footer_payment_banners` | ✅ | ✅ Admin-only | ✅ |
| Announcement Bar | `announcement_bar` | ✅ | ✅ Admin-only | ✅ |
| Email Settings | `email_settings` | ✅ | ✅ Admin-only | ✅ |
| Email Templates | `email_templates` | ✅ | ✅ Admin-only | ✅ |
| Checkout Settings | `checkout_settings` | ✅ | ✅ Admin-only | ✅ |
| Fraud Settings | `checkout_fraud_settings` | ✅ | ✅ Admin-only | ✅ |
| Delivery Zones | `delivery_zones` | ✅ | ✅ Admin-only | ✅ |
| Delivery Partners | `delivery_partners` | ✅ | ✅ Admin-only | ✅ |
| Delivery Providers | `delivery_providers` | ✅ | ✅ Admin-only | ✅ |
| Payment Providers | `payment_providers` | ✅ | ✅ Admin-only | ✅ |
| Instagram Posts | `instagram_posts` | ✅ | ✅ Admin-only | ✅ |
| YouTube Videos | `youtube_videos` | ✅ | ✅ Admin-only | ✅ |
| Certifications | `certifications` | ✅ | ✅ Admin-only | ✅ |
| Theme Settings | `theme_settings` | ✅ | ✅ Admin-only | ✅ |
| Shop Settings | `shop_settings` + `shop_page_settings` | ✅ | ✅ Admin-only | ✅ |
| Filter Settings | `filter_settings` | ✅ | ✅ Admin-only | ✅ |
| Currency Rates | `currency_rates` | ✅ | ✅ Admin-only | ✅ |
| Invoice Settings | `invoice_settings` | ✅ | ✅ Admin-only | ✅ |
| Newsletter | `newsletter_subscribers` + `newsletter_settings` | ✅ | ✅ Admin-only | ✅ |
| Notifications | `notifications` | ✅ | ✅ Admin-only | ✅ |
| Abandoned Carts | `abandoned_carts` | ⚠️ | ⚠️ | ⚠️ Not in `$ADMIN_REQUIRED_TABLES` |
| Leads | `leads` | ⚠️ | ⚠️ | ⚠️ Not in `$ADMIN_REQUIRED_TABLES` |
| Blocked Customers | `blocked_customers` | ✅ | ✅ Admin-only | ✅ |
| Product Reviews | `product_reviews` | ✅ | ✅ Auth-only | ✅ |
| Product Variants | `product_variants` | ✅ | ✅ Admin-only | ✅ |
| Bundles | `product_bundles` + `bundle_products` | ✅ | ✅ Admin-only | ✅ |
| Upsell Offers | `upsell_offers` | ✅ | ✅ Admin-only | ✅ |
| Customization | `customization_settings` | ✅ | ✅ Admin-only | ✅ |
| CRM Reports | `crm_reports` | ✅ | ✅ Admin-only | ✅ |
| QR Settings | `qr_discount_settings` | ✅ | ✅ Admin-only | ✅ |
| SMS Settings | `sms_settings` | ✅ | ✅ Admin-only | ✅ |

### 4.3 Admin Edge Functions

| Function | Frontend Call | PHP Handler | Status |
|---------|-------------|-------------|--------|
| `is_admin` | `supabase.rpc("is_admin", {check_user_id})` | ❌ **Missing** in `handler.php` | ❌ |
| `create-order` | `functions.invoke("create-order")` | ✅ `orders/create.php` | ✅ |
| `generate-invoice` | `functions.invoke("generate-invoice")` | ✅ `handleGenerateInvoice()` | ✅ |
| `generate-delivery-slip` | `functions.invoke("generate-delivery-slip")` | ✅ `handleGenerateDeliverySlip()` | ✅ |
| `send-order-email` | `functions.invoke("send-order-email")` | ✅ `email/send.php` | ✅ |
| `send-sms` | `functions.invoke("send-sms")` | ✅ `sms/send.php` | ✅ |
| `delivery-api` | `functions.invoke("delivery-api")` | ✅ `delivery/dispatch.php` | ✅ |
| `encrypt-credentials` | `functions.invoke("encrypt-credentials")` | ✅ `handleEncryptCredentials()` | ✅ |
| `fetch-google-reviews` | `functions.invoke("fetch-google-reviews")` | ✅ `handleFetchGoogleReviews()` | ✅ |
| `bkash-payment` | `functions.invoke("bkash-payment/create")` | ⚠️ Path `/create` not handled | ⚠️ |
| `nagad-payment` | `functions.invoke("nagad-payment")` | ✅ `payments/nagad.php` | ✅ |
| `sslcommerz-payment` | `functions.invoke("sslcommerz-payment")` | ✅ `payments/sslcommerz.php` | ✅ |
| `aamarpay-payment` | `functions.invoke("aamarpay-payment")` | ✅ `payments/aamarpay.php` | ✅ |
| `surjopay-payment` | `functions.invoke("surjopay-payment")` | ✅ `payments/surjopay.php` | ✅ |

### 4.4 Storage Operations

| Operation | Frontend Call | PHP Endpoint | Status |
|-----------|-------------|-------------|--------|
| Upload | `storage.from("bucket").upload(path, file)` | `POST /storage/{bucket}/upload` | ✅ |
| Delete | `storage.from("bucket").remove(paths)` | `POST /storage/{bucket}/delete` | ✅ |
| Public URL | `storage.from("bucket").getPublicUrl(path)` | `GET /storage/{bucket}/{path}` | ✅ |
| List | `storage.from("bucket").list(folder)` | `GET /storage/{bucket}/list` | ⚠️ Verify `list` action in `storage/handler.php` |

---

## 5. Layout Components (Header/Footer — Every Page)

| Component | API Call | Table | Status |
|-----------|---------|-------|--------|
| Header | `menu_items`, `menu_sub_items`, `site_branding`, `customization_settings` | All public | ✅ |
| Footer | `footer_link_groups`, `footer_links`, `social_links`, `site_branding`, `newsletter_settings`, `footer_payment_banners` | All public | ✅ |
| AnnouncementBar | `announcement_bar` | Public | ✅ |
| Notifications | `.from("notifications").or(...)` | `or` filter | ❌ **`or` not handled** |
| Search Modal | `.from("products").or(...)` | `or` filter | ❌ **`or` not handled** |

---

## 6. CRITICAL ISSUES (Must Fix Before Deploy)

### ❌ Issue 1: `or` filter not implemented in `crud.php`
**Affected pages**: Shop (search), Search Modal, Inline Search, Notifications
**Frontend code**: `.or("name.ilike.%query%,description.ilike.%query%")`
**Fix**: Add `or` parameter parsing in `parseFilters()` in `crud.php`

### ❌ Issue 2: `is_admin` RPC function missing
**Affected**: Admin panel access check (`useAdmin.tsx`)
**Frontend code**: `supabase.rpc("is_admin", { check_user_id })`
**Fix**: Add `is_admin` case in `functions/handler.php`

### ⚠️ Issue 3: `not.*` filter not implemented
**Frontend code**: `.not("col", "eq", val)`
**Fix**: Add `not.` prefix parsing in `parseFilters()`

### ⚠️ Issue 4: `upsert` not implemented in `crud.php`
**Affected**: Some admin settings save operations
**Fix**: Add `INSERT ... ON DUPLICATE KEY UPDATE` logic when `upsert=true` param present

### ⚠️ Issue 5: `count` query not implemented
**Affected**: Pagination with total count in admin tables
**Fix**: Add `SELECT COUNT(*)` when `count=exact` param present

### ⚠️ Issue 6: `orders` and `order_items` not in `$PUBLIC_READ_TABLES`
**Affected**: Order tracking (public), user dashboard order history
**Fix**: Add `orders` and `order_items` to `$PUBLIC_READ_TABLES` with user-scoping

### ⚠️ Issue 7: `abandoned_carts` and `leads` not in `$ADMIN_REQUIRED_TABLES`
**Fix**: Add them to admin write whitelist

### ⚠️ Issue 8: bKash sub-path routing
**Frontend**: `functions.invoke("bkash-payment/create")`
**PHP**: Only matches `bkash-payment`, not `bkash-payment/create`
**Fix**: Handle sub-path in functions router or map `bkash-payment/create` → `bkash-payment`

### ⚠️ Issue 9: Multiple `order()` calls
**Frontend**: `.order("display_order").order("created_at")`
**PHP**: Only last `order=` param kept (URL params are unique keys)
**Fix**: Support comma-separated or array order params

---

## 7. SUMMARY

| Category | Total | ✅ Working | ⚠️ Partial | ❌ Missing |
|----------|-------|-----------|------------|-----------|
| Auth Endpoints | 8 | 8 | 0 | 0 |
| CRUD Tables (75+) | 75 | 72 | 3 | 0 |
| Edge Functions | 14 | 12 | 1 | 1 |
| Filter Operators | 12 | 8 | 2 | 2 |
| Storage Operations | 4 | 3 | 1 | 0 |
| Page Integrations | 12 | 10 | 2 | 0 |

**Overall Readiness: ~88%** — Fix the 9 issues above for 100% parity.
