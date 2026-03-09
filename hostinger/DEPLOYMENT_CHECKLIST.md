# 🚀 Artistiya E-Commerce — Complete Deployment Checklist

> **Version:** 2.0.0 | **Last Updated:** 2026-03-09  
> **Platform:** Hostinger Shared Hosting (PHP 8.0+ / MySQL 8.0+)  
> **Architecture:** React SPA Frontend + PHP REST API Backend

---

## 📋 Table of Contents

1. [Pre-Deployment Requirements](#1-pre-deployment-requirements)
2. [Step 1: Build Frontend](#2-step-1-build-frontend)
3. [Step 2: Upload Files to Hostinger](#3-step-2-upload-files-to-hostinger)
4. [Step 3: Run Auto-Installer](#4-step-3-run-auto-installer)
5. [Step 4: Configure Environment](#5-step-4-configure-environment)
6. [Step 5: Verify API Endpoints](#6-step-5-verify-api-endpoints)
7. [Step 6: Configure Email (SMTP)](#7-step-6-configure-email-smtp)
8. [Step 7: Configure Payment Gateways](#8-step-7-configure-payment-gateways)
9. [Step 8: Configure Delivery Providers](#9-step-8-configure-delivery-providers)
10. [Step 9: SSL & Security Hardening](#10-step-9-ssl--security-hardening)
11. [Step 10: Final Production Checklist](#11-step-10-final-production-checklist)
12. [File Structure Reference](#12-file-structure-reference)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Pre-Deployment Requirements

### ✅ Hostinger Account Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| PHP Version | 8.0 | 8.2+ |
| MySQL Version | 8.0 | 8.0+ |
| Disk Space | 500MB | 2GB+ |
| RAM | 256MB | 512MB+ |
| SSL Certificate | Required | Auto (Let's Encrypt) |

### ✅ Local Development Requirements

| Tool | Purpose |
|------|---------|
| Node.js 18+ | Build frontend |
| npm or bun | Package manager |
| Git | Version control |
| Text editor | Configuration edits |

### ✅ Credentials You'll Need

- [ ] Hostinger panel login
- [ ] MySQL database name, username, password
- [ ] Domain name (connected to Hostinger)
- [ ] Admin email & password (for first admin account)
- [ ] SMTP email credentials (from Hostinger email)
- [ ] Payment gateway credentials (bKash/Nagad/SSLCommerz — if using)
- [ ] Delivery API keys (Pathao/Steadfast — if using)

---

## 2. Step 1: Build Frontend

### 1.1 Set the API Base URL

Create or edit `.env.production` in your project root:

```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

> ⚠️ **Replace `yourdomain.com` with your actual domain!**

### 1.2 Build the Production Bundle

```bash
# Install dependencies (if not done)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder containing:
```
dist/
├── index.html          ← SPA entry point
├── assets/
│   ├── index-*.js      ← Bundled JavaScript
│   ├── index-*.css     ← Bundled CSS
│   └── *.jpg/png/svg   ← Static assets
├── favicon.ico
├── robots.txt
└── ...
```

### 1.3 Verify Build Output

```bash
# Check build succeeded
ls -la dist/
# Should see index.html and assets/ folder
```

---

## 3. Step 2: Upload Files to Hostinger

### 2.1 Prepare Upload Structure

Your `public_html/` directory should look like this after upload:

```
public_html/
├── .htaccess                    ← From hostinger/.htaccess
├── index.html                   ← From dist/index.html
├── assets/                      ← From dist/assets/
├── favicon.ico                  ← From dist/
├── robots.txt                   ← From dist/
├── install.php                  ← From hostinger/install.php
├── bootstrap.php                ← From hostinger/bootstrap.php
├── DATABASE_SCHEMA_MYSQL.sql    ← From hostinger/DATABASE_SCHEMA_MYSQL.sql
├── api/                         ← From hostinger/api/ (entire folder)
│   ├── index.php
│   ├── crud.php
│   ├── middleware.php
│   ├── auth/
│   ├── orders/
│   ├── products/
│   ├── categories/
│   ├── payments/
│   ├── functions/
│   ├── storage/
│   ├── upload/
│   ├── email/
│   ├── sms/
│   ├── delivery/
│   ├── admin/
│   └── public/
├── config/                      ← From hostinger/config/ (entire folder)
│   ├── database.php
│   ├── delivery.php
│   ├── email.php
│   ├── payment.php
│   ├── sms.php
│   └── storage.php
├── storage/                     ← Create empty (file uploads go here)
│   ├── product_images/
│   ├── custom_designs/
│   ├── media/
│   └── testimonials/
└── templates/                   ← From hostinger/templates/
    └── email/
```

### 2.2 Upload Methods

#### Option A: File Manager (Recommended for beginners)

1. Log in to **Hostinger hPanel**
2. Go to **Files → File Manager**
3. Navigate to `public_html/`
4. **Delete** any existing files (default Hostinger placeholder)
5. Upload the `dist/` contents (index.html, assets/, etc.)
6. Upload the `hostinger/` folder contents (api/, config/, bootstrap.php, etc.)
7. Upload `.htaccess` from `hostinger/.htaccess`
8. Upload `install.php` from `hostinger/install.php`

#### Option B: FTP (Recommended for large uploads)

```bash
# Using lftp or any FTP client
Host: ftp.yourdomain.com
Username: (from Hostinger FTP Accounts)
Password: (from Hostinger FTP Accounts)
Port: 21

# Upload everything to public_html/
```

#### Option C: SSH (If available on your plan)

```bash
ssh u123456789@yourdomain.com

cd public_html/
# Upload via scp or rsync
```

### 2.3 Create Storage Directories

```bash
# Via File Manager or SSH, create these folders:
mkdir -p storage/product_images
mkdir -p storage/custom_designs
mkdir -p storage/media
mkdir -p storage/testimonials

# Set permissions
chmod -R 775 storage/
```

### 2.4 Set File Permissions

| Path | Permission | Purpose |
|------|-----------|---------|
| `public_html/` | 755 | Web root |
| `storage/` | 775 | File uploads |
| `.env.php` | 640 | Secrets (created by installer) |
| `config/database.php` | 640 | DB credentials |
| `api/` | 755 | API scripts |
| `.htaccess` | 644 | Apache config |
| `install.php` | 644 | Installer (auto-deletes) |

---

## 4. Step 3: Run Auto-Installer

### 3.1 Open Installer

Navigate to: **`https://yourdomain.com/install.php`**

### 3.2 Installer Steps

The web-based installer will guide you through:

#### Step 1: System Check
- Verifies PHP 8.0+, MySQL 8.0+
- Checks required extensions (PDO, json, mbstring, openssl)
- Validates file permissions

#### Step 2: Database Connection
Enter your MySQL credentials:

| Field | Value | Where to Find |
|-------|-------|--------------|
| Host | `localhost` | Hostinger → Databases |
| Port | `3306` | Default MySQL port |
| Database Name | `u123456789_artistiya` | Hostinger → Databases → Create |
| Username | `u123456789_admin` | Hostinger → Databases |
| Password | `your_db_password` | Set when creating database |

> 💡 **Create database first** in Hostinger hPanel → **Databases → MySQL Databases**

#### Step 3: Schema Import
- Automatically runs `DATABASE_SCHEMA_MYSQL.sql`
- Creates 80+ tables, triggers, functions
- Shows progress and table count

#### Step 4: Admin Account
- Enter admin email and password
- Creates first admin user with `admin` role
- This account can access `/admin` dashboard

#### Step 5: Completion
- Generates `.env.php` (encryption keys, JWT secret)
- Generates `config/database.php`
- Creates `install.lock` to prevent re-installation
- **Auto-deletes `install.php`** for security

### 3.3 Verify Installation

After installer completes, verify:

```
✅ .env.php exists (not accessible via browser)
✅ config/database.php has correct credentials
✅ install.lock exists
✅ install.php is deleted
```

---

## 5. Step 4: Configure Environment

### 4.1 Edit `.env.php` (if needed)

The installer auto-generates this file. Edit via File Manager if you need to change:

```php
// Application URL (make sure this matches your domain)
define('APP_URL', 'https://yourdomain.com');

// JWT settings
define('JWT_EXPIRY', 86400); // 24 hours (adjust if needed)
```

### 4.2 Verify .htaccess

Ensure `.htaccess` is in `public_html/` root. Test by visiting:

- `https://yourdomain.com/` → Should show your React app
- `https://yourdomain.com/api/public/site-branding` → Should return JSON
- `https://yourdomain.com/shop` → Should show shop (SPA routing)
- `https://yourdomain.com/.env.php` → Should return **403 Forbidden**

### 4.3 PHP Version Check

In Hostinger hPanel:
1. Go to **Advanced → PHP Configuration**
2. Set PHP version to **8.2** (or latest 8.x)
3. Ensure these extensions are enabled:
   - `pdo_mysql`
   - `json`
   - `mbstring`
   - `openssl`
   - `fileinfo`
   - `gd` or `imagick`

---

## 6. Step 5: Verify API Endpoints

Test these URLs in your browser or Postman:

### Public Endpoints (No Auth Required)

| Endpoint | Expected |
|----------|----------|
| `GET /api/products?eq.is_active=1&limit=5` | Product list (JSON array) |
| `GET /api/categories` | Category list |
| `GET /api/hero_slides?eq.is_active=1` | Hero slides |
| `GET /api/site_branding?single=true` | Site branding object |
| `GET /api/delivery_zones?eq.is_active=1` | Delivery zones |
| `GET /api/faq_items?eq.is_active=1` | FAQ items |

### Auth Endpoints

```bash
# Register
curl -X POST https://yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","full_name":"Test User"}'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your_admin_password"}'

# Session (use token from login)
curl https://yourdomain.com/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Admin Endpoints (Require Admin Token)

```bash
# Check admin status
curl -X POST https://yourdomain.com/api/functions/is_admin \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"check_user_id":"admin-user-id"}'
```

---

## 7. Step 6: Configure Email (SMTP)

### 6.1 Hostinger SMTP Settings

1. Go to Hostinger hPanel → **Emails → Email Accounts**
2. Create an email: `info@yourdomain.com`
3. Note the credentials

### 6.2 Update Email Config

Edit `config/email.php`:

```php
return [
    'default_provider' => 'smtp',
    'providers' => [
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl',
            'username'   => 'info@yourdomain.com',
            'password'   => 'your_email_password',
            'from_email' => 'info@yourdomain.com',
            'from_name'  => 'Artistiya',
        ],
    ],
];
```

### 6.3 Test Email

From admin panel → Email Settings → Send Test Email

---

## 8. Step 7: Configure Payment Gateways

### 8.1 Edit `config/payment.php`

Enable the gateways you need:

```php
'bkash' => [
    'enabled'     => true,       // ← Enable
    'sandbox'     => false,      // ← Set false for production
    'app_key'     => 'YOUR_BKASH_APP_KEY',
    'app_secret'  => 'YOUR_BKASH_APP_SECRET',
    'username'    => 'YOUR_BKASH_USERNAME',
    'password'    => 'YOUR_BKASH_PASSWORD',
    // ...
],
```

### 8.2 Available Gateways

| Gateway | Config Key | Sandbox URL |
|---------|-----------|-------------|
| bKash | `bkash` | tokenized.sandbox.bka.sh |
| Nagad | `nagad` | sandbox.mynagad.com |
| SSLCommerz | `sslcommerz` | sandbox.sslcommerz.com |
| aamarPay | `aamarpay` | sandbox.aamarpay.com |
| SurjoPay | `surjopay` | sandbox.surjopay.com |
| Cash on Delivery | `cod` | N/A (always available) |

### 8.3 Payment Flow

1. Customer selects payment method at checkout
2. Frontend calls `/api/functions/{gateway}-payment`
3. PHP handler redirects to gateway or returns payment URL
4. Gateway callback hits `/api/payments/{gateway}/callback`
5. Order status updated to `confirmed`

> ⚠️ **Always test with sandbox first!** Set `'sandbox' => true` during testing.

---

## 9. Step 8: Configure Delivery Providers

### 9.1 Edit `config/delivery.php`

```php
'providers' => [
    'pathao' => [
        'enabled'       => true,
        'client_id'     => 'YOUR_PATHAO_CLIENT_ID',
        'client_secret' => 'YOUR_PATHAO_SECRET',
        'username'      => 'YOUR_PATHAO_EMAIL',
        'password'      => 'YOUR_PATHAO_PASSWORD',
    ],
    'steadfast' => [
        'enabled'   => true,
        'api_key'   => 'YOUR_STEADFAST_API_KEY',
        'secret_key'=> 'YOUR_STEADFAST_SECRET',
    ],
],
```

### 9.2 Delivery Zones

Set up delivery zones from Admin Panel → Delivery Zones:

| Division | District | Shipping Cost (৳) | Est. Days |
|----------|---------|-------------------|-----------|
| Dhaka | Dhaka | 60 | 1-2 |
| Dhaka | Others | 100 | 2-3 |
| Other Divisions | All | 120-150 | 3-5 |

---

## 10. Step 9: SSL & Security Hardening

### 10.1 SSL Certificate

1. Hostinger hPanel → **Security → SSL**
2. Install **Let's Encrypt** (free) for your domain
3. Enable **Force HTTPS** redirect

### 10.2 Security Checklist

- [x] `.htaccess` blocks access to `.env.php`, `config/`, `*.sql`, `*.log`
- [x] `install.php` auto-deleted after installation
- [x] `install.lock` prevents re-installation
- [x] JWT tokens expire after 24 hours
- [x] Password hashing uses Argon2id
- [x] Rate limiting on login (5 attempts → 15 min block)
- [x] SQL injection prevented via PDO prepared statements
- [x] XSS prevented via `htmlspecialchars()` sanitization
- [x] CORS headers configured
- [x] Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- [x] Directory listing disabled (`Options -Indexes`)

### 10.3 Additional Hardening

```apache
# Add to .htaccess if not already present:

# Block PHP execution in storage
<Directory "storage">
  <FilesMatch "\.php$">
    Require all denied
  </FilesMatch>
</Directory>
```

---

## 11. Step 10: Final Production Checklist

### ✅ Pre-Launch Verification

| # | Check | Status |
|---|-------|--------|
| 1 | Homepage loads correctly | ☐ |
| 2 | Products display with images | ☐ |
| 3 | Category filtering works | ☐ |
| 4 | Product search works | ☐ |
| 5 | User registration works | ☐ |
| 6 | User login works | ☐ |
| 7 | Add to cart works | ☐ |
| 8 | Checkout completes (COD) | ☐ |
| 9 | Order confirmation email sends | ☐ |
| 10 | Admin login works (`/admin`) | ☐ |
| 11 | Admin can add products | ☐ |
| 12 | Admin can manage orders | ☐ |
| 13 | Image upload works | ☐ |
| 14 | Mobile responsive layout | ☐ |
| 15 | SSL (HTTPS) active | ☐ |
| 16 | `install.php` deleted | ☐ |
| 17 | Error logging working | ☐ |
| 18 | Favicon & PWA icons | ☐ |
| 19 | SEO meta tags on pages | ☐ |
| 20 | Payment gateway (sandbox test) | ☐ |

### ✅ Post-Launch

- [ ] Monitor `storage/error.log` for PHP errors
- [ ] Set up Hostinger auto-backups (daily)
- [ ] Test order flow end-to-end
- [ ] Switch payment gateways from sandbox to live
- [ ] Set up Google Analytics (via admin → Integrations)
- [ ] Submit sitemap to Google Search Console

---

## 12. File Structure Reference

```
public_html/                        ← Web root (Hostinger)
│
├── .htaccess                       ← URL rewriting, security, caching
├── .env.php                        ← ⛔ Secrets (auto-generated, blocked from web)
├── install.lock                    ← ⛔ Installation lock file
├── bootstrap.php                   ← ⛔ App bootstrap (blocked from web)
│
├── index.html                      ← React SPA entry point
├── assets/                         ← Vite build output (JS/CSS/images)
├── favicon.ico
├── robots.txt
│
├── api/                            ← PHP REST API
│   ├── index.php                   ← Central router
│   ├── crud.php                    ← Generic CRUD (75+ tables)
│   ├── middleware.php              ← JWT auth, helpers
│   ├── auth/                       ← Authentication
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── logout.php
│   │   ├── session.php
│   │   ├── profile.php
│   │   └── reset-password.php
│   ├── orders/                     ← Order management
│   │   ├── create.php
│   │   ├── list.php
│   │   └── manage.php
│   ├── products/                   ← Product endpoints
│   │   ├── list.php
│   │   ├── detail.php
│   │   └── manage.php
│   ├── categories/
│   │   ├── list.php
│   │   └── manage.php
│   ├── payments/                   ← Payment gateways
│   │   ├── bkash.php
│   │   ├── nagad.php
│   │   ├── sslcommerz.php
│   │   ├── aamarpay.php
│   │   └── surjopay.php
│   ├── functions/                  ← Edge function replacements
│   │   └── handler.php
│   ├── storage/                    ← File upload/serve
│   │   └── handler.php
│   ├── email/
│   │   └── send.php
│   ├── sms/
│   │   └── send.php
│   ├── delivery/
│   │   └── dispatch.php
│   ├── admin/
│   │   ├── dashboard.php
│   │   ├── customers.php
│   │   └── settings.php
│   ├── public/                     ← Public read-only endpoints
│   │   ├── hero-slides.php
│   │   ├── menu.php
│   │   ├── site-branding.php
│   │   └── ... (15+ files)
│   └── upload/
│       └── file.php
│
├── config/                         ← ⛔ Configuration (blocked from web)
│   ├── database.php
│   ├── email.php
│   ├── payment.php
│   ├── delivery.php
│   ├── sms.php
│   └── storage.php
│
├── storage/                        ← File uploads
│   ├── product_images/
│   ├── custom_designs/
│   ├── media/
│   └── testimonials/
│
└── templates/
    └── email/                      ← Email templates
```

---

## 13. Troubleshooting

### ❌ "500 Internal Server Error"

1. Check `storage/error.log` for PHP errors
2. Verify PHP version is 8.0+
3. Ensure `.htaccess` `RewriteEngine On` is supported (mod_rewrite enabled)
4. Check file permissions (755 for directories, 644 for files)

### ❌ "404 Not Found" on API routes

1. Verify `.htaccess` is in `public_html/` root
2. Check Apache mod_rewrite is enabled
3. Test: `https://yourdomain.com/api/categories` should return JSON

### ❌ "Application not configured" error

1. Ensure you ran `install.php` successfully
2. Check `.env.php` exists in `public_html/`
3. Check `config/database.php` has correct credentials

### ❌ Frontend loads but API calls fail

1. Check browser console for CORS errors
2. Verify `VITE_API_BASE_URL` was set correctly during build
3. Test API directly: `https://yourdomain.com/api/products`

### ❌ Images not uploading

1. Check `storage/` directory exists and has `775` permissions
2. Verify PHP `upload_max_filesize` is at least `20M`
3. Check `post_max_size` is at least `25M`

### ❌ Login returns "Invalid token"

1. Verify JWT_SECRET in `.env.php` hasn't changed
2. Clear browser localStorage
3. Check server time is correct (JWT expiry depends on server time)

### ❌ Admin panel not accessible

1. Login with admin credentials
2. Verify user has `admin` role in `user_roles` table
3. Test: `POST /api/functions/is_admin` with your token

### ❌ SPA routes return 404 (e.g., /shop, /admin)

1. Verify `.htaccess` has the SPA fallback rule
2. The rule should send non-file, non-API routes to `index.html`
3. Check: `RewriteRule ^(.*)$ index.html [QSA,L]`

---

## 📞 Quick Reference

| Resource | URL |
|----------|-----|
| Frontend | `https://yourdomain.com/` |
| Admin Panel | `https://yourdomain.com/admin` |
| API Base | `https://yourdomain.com/api/` |
| File Storage | `https://yourdomain.com/storage/` |
| Error Log | `public_html/storage/error.log` |

---

**🎉 Deployment Complete!** Your Artistiya e-commerce platform is now live on Hostinger.
