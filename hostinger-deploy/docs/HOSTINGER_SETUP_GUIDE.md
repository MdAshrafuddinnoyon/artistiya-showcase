# Artistiya — Hostinger Deployment & Setup Guide

## 🚀 Quick Deployment Steps

### Step 1: Prepare Hosting
1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **Websites → Manage**
3. Note your **domain** and **FTP credentials**

### Step 2: Create Database
1. Go to **Databases → MySQL Databases**
2. Create a new database (e.g., `u123456789_artistiya`)
3. Note: **DB Name**, **DB User**, **DB Password**
4. DB Host is usually `localhost` on Hostinger shared hosting

### Step 3: Upload Files
1. Go to **Files → File Manager** or use FTP
2. Upload all project files to `public_html/`
3. Upload `docs/migration/install.php` to `public_html/install.php`
4. Upload `docs/migration/DATABASE_SCHEMA_MYSQL.sql` alongside it

### Step 4: Run Auto-Installer
1. Visit `https://yourdomain.com/install.php`
2. Follow the 5-step wizard:
   - **Environment Check**: Verifies PHP 8.0+, PDO, OpenSSL
   - **Database Setup**: Enter MySQL credentials → auto-creates tables
   - **Schema Install**: 60+ tables, triggers, functions created
   - **Data Import**: Optional — upload seed data .sql file
   - **Admin Creation**: Create admin account (Argon2ID hashed)
3. Installer auto-deletes after completion

### Step 5: Configure Email (SMTP)
1. Go to hPanel → **Emails → Email Accounts**
2. Create an email account (e.g., `info@yourdomain.com`)
3. Go to **Emails → Connect Apps & Devices** for SMTP credentials:
   - Host: `smtp.hostinger.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: Your full email address
   - Password: Your email password
4. Update in Admin Dashboard → Settings → Email

---

## 📁 File Structure After Deployment

```
public_html/
├── api/                    # PHP API endpoints
│   ├── index.php           # API router
│   ├── auth/               # Authentication endpoints
│   ├── products/           # Product CRUD
│   ├── orders/             # Order management
│   ├── payments/           # Payment gateway handlers
│   ├── delivery/           # Delivery dispatch
│   ├── email/              # Email sending
│   ├── sms/                # SMS gateway
│   ├── documents/          # Invoice & delivery slip generation
│   └── admin/              # Admin-only endpoints
├── config/
│   ├── database.php        # DB connection (auto-generated)
│   ├── email.php           # Email provider config
│   ├── sms.php             # SMS provider config
│   ├── payment.php         # Payment gateway config
│   ├── delivery.php        # Delivery provider config
│   └── storage.php         # File storage config
├── storage/
│   ├── products/           # Product images
│   ├── custom-designs/     # Custom order uploads
│   ├── media/              # General media
│   └── testimonials/       # Testimonial images
├── .env.php                # Environment secrets (protected)
├── .htaccess               # Apache rewrites & security
└── index.html              # Frontend SPA
```

---

## 🔒 Security Checklist

- [ ] `.env.php` is NOT accessible via browser (check `.htaccess`)
- [ ] `install.php` has been deleted after setup
- [ ] `install.lock` file exists in root
- [ ] Admin password is strong (12+ chars, mixed case, numbers)
- [ ] HTTPS is enabled (Hostinger → SSL → Force HTTPS)
- [ ] File permissions: directories `755`, files `644`
- [ ] `storage/` directory is writable (`775`)
- [ ] PHP `display_errors` is OFF in production

---

## 🔧 Troubleshooting

### "500 Internal Server Error"
- Check `.htaccess` is correct
- Verify PHP version is 8.0+ (hPanel → PHP Configuration)
- Check error log: hPanel → Files → Error Logs

### "Database connection failed"
- Verify credentials in `.env.php` match hPanel database settings
- DB Host should be `localhost` for Hostinger shared hosting
- Check that the database exists and user has permissions

### "Email not sending"
- Verify SMTP credentials match the email account in hPanel
- Try port 465 with SSL first, then 587 with TLS
- Check email sending limits (Hostinger: ~500/day on shared)

### "File upload failed"
- Check `storage/` directory permissions (should be 775)
- Verify PHP `upload_max_filesize` and `post_max_size` in PHP Configuration
- Recommended: `upload_max_filesize = 20M`, `post_max_size = 25M`

### Auto-Installer Recovery
If the installer fails mid-way:
1. Delete `install.lock` if it exists
2. Re-upload `install.php` from `docs/migration/`
3. Run the installer again — it will detect existing tables and skip them
4. Each PHP config file in `docs/migration/php-config/` can be manually copied to `config/`

---

## 📊 Performance Optimization

### PHP Configuration (hPanel → Advanced → PHP Configuration)
```
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 20M
post_max_size = 25M
max_input_vars = 5000
```

### .htaccess Optimizations
```apache
# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Protect sensitive files
<Files ".env.php">
  Require all denied
</Files>
<Files "install.php">
  Require all denied
</Files>
```

---

## 🗄️ Database Maintenance

### Backup (via hPanel)
1. Go to **Files → Backups**
2. Click **Generate new backup**
3. Download MySQL backup separately

### Manual Backup (phpMyAdmin)
1. Go to hPanel → **Databases → phpMyAdmin**
2. Select your database
3. Click **Export → Custom → SQL format → Go**

### Restore
1. Drop all tables in phpMyAdmin
2. Import the backup .sql file
3. Or re-run `install.php` with fresh schema
