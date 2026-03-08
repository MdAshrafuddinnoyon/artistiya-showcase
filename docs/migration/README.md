# Artistiya E-Commerce: Complete Migration Documentation

## 📁 Files

| File | Description |
|------|-------------|
| `DATABASE_SCHEMA_MYSQL.sql` | Complete MySQL 8.0+ schema — 60+ tables, 1 view, 4 functions, 6 triggers, 2 procedures |
| `PHP_MIGRATION_GUIDE.md` | PHP/MySQL migration guide — API, Payment, Delivery, Auth, Email (Hostinger SMTP), SMS, OTP, File Upload |
| `SECURITY_HARDENING_GUIDE.md` | SQLi, XSS, CSRF prevention, AES-256, OWASP Top 10 |
| `FRONTEND_MIGRATION_GUIDE.md` | Frontend Supabase SDK → PHP API replacement guide — 128 file mapping, Auth, Storage, Edge Functions |
| `POSTMAN_COLLECTION.json` | **Postman v2.1 Collection** — 90+ API requests across 18 folders (Auth, Products, Orders, Payments, Delivery, Email, SMS, CRM, etc.) |
| `API_TEST_GUIDE.md` | API verification checklist, security tests, parity matrix, automated health check script |

## 📦 Frontend API Client

| File | Description |
|------|-------------|
| `src/lib/api.ts` | PHP API client — Drop-in replacement for Supabase SDK. Covers CRUD, Auth, Storage, Edge Functions → PHP API. |

## 🔄 Supabase → MySQL/PHP Full Parity

### Key Mappings

| Category | Count | Details |
|----------|-------|---------|
| Tables | 60+ | All Supabase tables + email_queue, email_log, sms_settings, sms_log, otp_codes |
| Triggers | 6 | Fraud detection, customer sync, auto profile |
| Functions | 4 | is_admin, lead/newsletter rate limits, order number |
| Procedures | 2 | Credential encrypt/decrypt |
| Views | 1 | public_site_branding |
| ENUMs | 3 | order_status, payment_method, custom_order_status |
| Storage Buckets | 4 | custom-designs, product-images, media, testimonials |
| Edge Functions → PHP API | 12+ | Orders, payments, email, SMS, delivery, invoices |
| API Endpoints | 90+ | Full REST API documented in Postman collection |

## ✅ Full Parity Checklist

- [x] 60+ tables (all Supabase tables + PHP-specific)
- [x] 6 triggers (fraud detection, customer sync, auto profile)
- [x] 4 functions (is_admin, lead/newsletter rate limits, order number)
- [x] 2 procedures (credential encrypt/decrypt)
- [x] 1 view (public_site_branding)
- [x] 3 ENUMs (order_status, payment_method, custom_order_status)
- [x] 4 Storage bucket equivalents
- [x] 12+ Edge Function → PHP API equivalents
- [x] RLS → PHP middleware mapping
- [x] Hostinger SMTP email system (queue, templates, auto-send)
- [x] SMS gateway system (Twilio, BulkSMSBD, SMSQ, GreenWeb, Infobip, Nexmo, Custom)
- [x] OTP service (generation, verification, rate limiting)
- [x] Order confirmation / shipping / delivery auto-email & SMS
- [x] All text in English (no Bengali in PHP codebase)
- [x] Postman collection with 90+ test requests
- [x] Frontend PHP API client (src/lib/api.ts)
- [x] Automated API health check script
