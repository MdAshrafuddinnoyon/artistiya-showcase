# Artistiya PHP API — Test & Verification Guide

## 📌 Overview

This document provides step-by-step instructions to verify that all PHP API endpoints are working correctly and maintain full parity with the Supabase backend.

---

## 🚀 Quick Start

### 1. Import Postman Collection

```
File → Import → Upload File → POSTMAN_COLLECTION.json
```

### 2. Set Environment Variables

| Variable | Value |
|----------|-------|
| `base_url` | `https://yourdomain.com/api` |
| `auth_token` | *(auto-set after login)* |

### 3. Run Login first — token auto-saves to collection variables

---

## ✅ API Endpoint Verification Checklist

### Authentication (5 endpoints)
- [ ] `POST /auth/signup` — Register new user, returns user_id
- [ ] `POST /auth/login` — Returns JWT token + is_admin flag
- [ ] `GET /auth/session` — Validates token, returns user info
- [ ] `POST /auth/logout` — Invalidates session
- [ ] `POST /auth/reset-password` — Sends reset email

### Products CRUD (11 endpoints)
- [ ] `GET /products` — List with filters (eq, ilike, gte, lte, order, limit)
- [ ] `GET /products?eq.id=...&single=true` — Single product
- [ ] `GET /products?eq.slug=...` — By slug
- [ ] `GET /products?ilike.name=%search%` — Search
- [ ] `GET /products?eq.category_id=...` — By category
- [ ] `GET /products?gte.price=...&lte.price=...` — Price range
- [ ] `GET /products?eq.is_featured=1` — Featured
- [ ] `GET /products?eq.is_new_arrival=1` — New arrivals
- [ ] `POST /products` — Create (admin)
- [ ] `PATCH /products?eq.id=...` — Update (admin)
- [ ] `DELETE /products?eq.id=...` — Delete (admin)

### Categories (5 endpoints)
- [ ] `GET /categories` — List all
- [ ] `GET /categories?eq.slug=...` — By slug
- [ ] `POST /categories` — Create (admin)
- [ ] `PATCH /categories?eq.id=...` — Update (admin)
- [ ] `DELETE /categories?eq.id=...` — Delete (admin)

### Orders (6 endpoints)
- [ ] `POST /orders` — Create order (server-side price verification)
- [ ] `GET /orders` — List (admin)
- [ ] `GET /orders?eq.id=...&single=true` — With items & address
- [ ] `GET /orders?eq.user_id=me` — My orders
- [ ] `PATCH /orders?eq.id=...` — Update status (admin)
- [ ] `GET /orders?eq.order_number=...` — Track (public)

### Payment Gateways (7 endpoints)
- [ ] `POST /functions/sslcommerz-payment` — SSLCommerz init
- [ ] `POST /functions/bkash-payment` — bKash init
- [ ] `POST /functions/nagad-payment` — Nagad init
- [ ] `POST /functions/aamarpay-payment` — AamarPay init
- [ ] `POST /functions/surjopay-payment` — SurjoPay init
- [ ] `POST /payment-callback?gateway=...` — Webhook/IPN
- [ ] `GET /payment_providers` — List active (admin)

### Delivery (7 endpoints)
- [ ] `POST /functions/delivery-api` (create_order) — Single dispatch
- [ ] `POST /functions/delivery-api` (bulk_create) — Steadfast bulk
- [ ] `POST /functions/delivery-api` (track) — Track parcel
- [ ] `POST /functions/delivery-api` (get_areas) — Area list
- [ ] `POST /functions/delivery-api` (price_plan) — Calculate price
- [ ] `POST /delivery-webhook` — Courier callback
- [ ] `GET /delivery_providers` — List active (admin)

### Email (5 endpoints)
- [ ] `POST /functions/send-order-email` (order_confirmation)
- [ ] `POST /functions/send-order-email` (shipping_update)
- [ ] `GET /email_settings` — Get settings (admin)
- [ ] `PATCH /email_settings` — Update (admin)
- [ ] `GET /email_templates` — List templates (admin)

### SMS & OTP (4 endpoints)
- [ ] `POST /functions/send-sms` — Send SMS
- [ ] `POST /otp/send` — Generate & send OTP
- [ ] `POST /otp/verify` — Verify OTP code
- [ ] `GET /sms_settings` — Get settings (admin)

### Storage (3 endpoints)
- [ ] `POST /storage/{bucket}/upload` — File upload
- [ ] `POST /storage/{bucket}/delete` — Delete files
- [ ] `GET /storage/{bucket}/{path}` — Public URL/serve

### Homepage & CMS (10 endpoints)
- [ ] `GET /hero_slides` — Active slides
- [ ] `GET /featured_sections` — Active sections
- [ ] `GET /homepage_content` — Dynamic content
- [ ] `GET /homepage_sections` — Section config
- [ ] `GET /testimonials` — Active testimonials
- [ ] `GET /faq_items` — FAQ list
- [ ] `GET /content_pages?eq.page_key=...` — CMS pages
- [ ] `GET /site_branding` — Branding data
- [ ] `GET /announcement_bar` — Announcements
- [ ] `GET /instagram_posts` — Instagram feed

### Blog (4 endpoints)
- [ ] `GET /blog_posts` — Published posts
- [ ] `GET /blog_posts?eq.slug=...` — Single post
- [ ] `GET /blog_categories` — Categories
- [ ] `GET /blog_settings` — Settings

### Other Features
- [ ] `GET/POST/DELETE /wishlist_items` — Wishlist CRUD
- [ ] `GET /promo_codes?eq.code=...` — Validate promo
- [ ] `POST /promo_codes` — Create (admin)
- [ ] `GET /customers` — CRM list (admin)
- [ ] `POST /custom_order_requests` — Submit custom order
- [ ] `GET/POST /product_reviews` — Reviews
- [ ] `GET /notifications` — User notifications
- [ ] `POST /newsletter_subscribers` — Subscribe
- [ ] `GET /menu_items` — Navigation menus
- [ ] `GET /footer_link_groups` — Footer links
- [ ] `GET /currency_rates` — Active currencies
- [ ] `POST /functions/generate-invoice` — Invoice PDF
- [ ] `POST /functions/generate-delivery-slip` — Delivery slip

---

## 🔒 Security Verification

| Check | Method |
|-------|--------|
| SQL Injection | Send `' OR 1=1 --` in search fields → must return error, not data |
| XSS Prevention | Send `<script>alert(1)</script>` in name fields → must be sanitized |
| CSRF Protection | POST without token → must return 401 |
| Rate Limiting | Send 10 rapid login attempts → must block after 5 |
| Amount Tampering | Modify `total` in order request → server must recalculate |
| JWT Expiry | Use expired token → must return 401 |
| Admin-only routes | Access admin endpoints without admin role → must return 403 |

---

## 📊 Supabase ↔ PHP Parity Matrix

| Feature | Supabase | PHP | Status |
|---------|----------|-----|--------|
| Tables | 60+ (PostgreSQL) | 60+ (MySQL 8.0) | ✅ Full |
| Auth | supabase.auth | JWT + Argon2id | ✅ Full |
| RLS Policies | PostgreSQL RLS | PHP middleware | ✅ Full |
| Edge Functions (12) | Deno runtime | PHP API scripts | ✅ Full |
| Storage (4 buckets) | Supabase Storage | Local/S3 | ✅ Full |
| Realtime | WebSocket | Polling/SSE | ⚠️ Partial |
| Triggers (6) | PostgreSQL | MySQL triggers | ✅ Full |
| Functions (4) | PL/pgSQL | MySQL functions | ✅ Full |
| Views (1) | PostgreSQL | MySQL views | ✅ Full |
| Encryption | pgcrypto | AES-256-GCM (PHP) | ✅ Full |
| Email | Edge Function | PHPMailer SMTP | ✅ Full |
| SMS | Edge Function | Multi-provider PHP | ✅ Full |
| OTP | N/A | PHP OTP service | ✅ Full |

---

## 🧪 Automated Test Script (PHP)

```php
<?php
// tests/api-health-check.php
$baseUrl = 'https://yourdomain.com/api';
$results = [];

function testEndpoint(string $method, string $url, ?array $body = null, ?string $token = null): array {
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_TIMEOUT => 10,
    ]);
    if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'ok' => $httpCode >= 200 && $httpCode < 400];
}

// Public endpoints
$tests = [
    ['GET',  "$baseUrl/products?limit=1", null, null, 'List Products'],
    ['GET',  "$baseUrl/categories?limit=1", null, null, 'List Categories'],
    ['GET',  "$baseUrl/hero_slides?eq.is_active=1", null, null, 'Hero Slides'],
    ['GET',  "$baseUrl/testimonials?eq.is_active=1", null, null, 'Testimonials'],
    ['GET',  "$baseUrl/faq_items?eq.is_active=1", null, null, 'FAQ Items'],
    ['GET',  "$baseUrl/site_branding?single=true", null, null, 'Site Branding'],
    ['GET',  "$baseUrl/blog_posts?eq.is_published=1&limit=1", null, null, 'Blog Posts'],
    ['GET',  "$baseUrl/currency_rates?eq.is_active=1", null, null, 'Currency Rates'],
];

echo "🔍 API Health Check\n" . str_repeat('=', 50) . "\n";
foreach ($tests as [$method, $url, $body, $token, $name]) {
    $result = testEndpoint($method, $url, $body, $token);
    $status = $result['ok'] ? '✅' : '❌';
    echo "$status $name — HTTP {$result['code']}\n";
}
echo str_repeat('=', 50) . "\nDone.\n";
```

Run: `php tests/api-health-check.php`

---

## 📝 Notes

- All admin endpoints require JWT with admin role
- `eq.user_id=me` is resolved server-side from JWT `sub` claim
- `select=*,relation(*)` triggers server-side JOINs
- Response header `X-Total-Count` provides total row count when `count=exact`
- File uploads use `multipart/form-data`, not JSON
- Payment callbacks use `application/x-www-form-urlencoded` (SSLCommerz/AamarPay)
