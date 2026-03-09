# Artistiya E-Commerce — Hostinger Deployment Package

## 📋 Overview

Complete, self-contained PHP backend for deploying on Hostinger (PHP 8.0+ / MySQL 8.0+).

### Included
- ✅ PHP REST API — Generic CRUD for 75+ tables
- ✅ JWT Authentication — Login, signup, password reset
- ✅ File Storage — Local uploads (replaces Supabase Storage)
- ✅ MySQL Schema — Full database with triggers, functions, views
- ✅ Auto-Installer — Web-based setup with self-deletion
- ✅ Payment/Delivery/Email/SMS integrations

## 🚀 Installation

1. Upload `hostinger/` contents to `public_html/`
2. Open `https://yourdomain.com/install.php`
3. Enter DB credentials → Create admin → Done
4. Build frontend: `VITE_API_BASE_URL=https://yourdomain.com/api npm run build`
5. Upload `dist/` to `public_html/`

## 🏗️ API Structure

```
api/index.php     → Central router
api/crud.php      → Generic CRUD (replaces Supabase PostgREST)
api/middleware.php → JWT auth
api/auth/         → Login, register, session, profile
api/storage/      → File upload/serve
api/functions/    → Edge function replacements
api/public/       → Public data endpoints
```

### Generic CRUD
```
GET    /api/products?eq.is_active=true&limit=12
POST   /api/products          (JSON body)
PATCH  /api/products?eq.id=x  (JSON body)
DELETE /api/products?eq.id=x
```

## 🔐 Security
- JWT (HS256), ARGON2ID passwords, AES-256 encryption
- Rate limiting, prepared statements, CORS, .htaccess protection
