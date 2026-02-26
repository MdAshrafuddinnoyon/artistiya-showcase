# Artistiya E-Commerce: মাইগ্রেশন ডকুমেন্টেশন

## 📁 ফাইল তালিকা

| ফাইল | বিবরণ |
|------|--------|
| `DATABASE_SCHEMA_MYSQL.sql` | সম্পূর্ণ MySQL 8.0+ ডাটাবেজ স্কিমা (৫০+ টেবিল) |
| `PHP_MIGRATION_GUIDE.md` | PHP/MySQL মাইগ্রেশন, API, পেমেন্ট ও ডেলিভারি গাইড |
| `SECURITY_HARDENING_GUIDE.md` | SQLi, XSS, CSRF প্রতিরোধ ও OWASP Top 10 চেকলিস্ট |

## 🚀 দ্রুত শুরু

```bash
# ১. MySQL-এ স্কিমা import
mysql -u root -p artistiya_store < DATABASE_SCHEMA_MYSQL.sql

# ২. PHP প্রজেক্ট সেটআপ
composer init
cp .env.example .env
# .env এডিট করুন

# ৩. Supabase থেকে ডেটা মাইগ্রেট
# PHP_MIGRATION_GUIDE.md দেখুন
```

## 🔒 সিকিউরিটি ফিচার

- ✅ PDO Prepared Statements (SQL Injection proof)
- ✅ AES-256-GCM Credential Encryption
- ✅ CSRF Token Protection
- ✅ Rate Limiting (login, order, API)
- ✅ Server-side Price Verification
- ✅ Argon2id Password Hashing
- ✅ XSS Output Encoding
- ✅ HTTPS Enforcement

## 💳 পেমেন্ট গেটওয়ে

- SSLCommerz (IPN + Validation API)
- bKash Tokenized Checkout
- Nagad Payment API
- AamarPay
- SurjoPay

## 🚚 ডেলিভারি পার্টনার

- Steadfast Courier
- eCourier
- Delivery Tiger
- Pathao
- RedX
- Paperfly
