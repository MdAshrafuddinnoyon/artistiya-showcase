# Artistiya E-Commerce: সিকিউরিটি হার্ডেনিং গাইড (PHP/MySQL)

## সূচিপত্র
1. [SQL Injection প্রতিরোধ](#sql-injection-প্রতিরোধ)
2. [XSS প্রতিরোধ](#xss-প্রতিরোধ)
3. [CSRF প্রতিরোধ](#csrf-প্রতিরোধ)
4. [Authentication সিকিউরিটি](#authentication-সিকিউরিটি)
5. [পেমেন্ট সিকিউরিটি](#পেমেন্ট-সিকিউরিটি)
6. [ডেটা এনক্রিপশন](#ডেটা-এনক্রিপশন)
7. [Server Hardening](#server-hardening)
8. [OWASP Top 10 চেকলিস্ট](#owasp-top-10-চেকলিস্ট)

---

## SQL Injection প্রতিরোধ

### ❌ ভুল পদ্ধতি (NEVER DO THIS)

```php
// DANGEROUS - SQL Injection vulnerable!
$name = $_GET['name'];
$query = "SELECT * FROM products WHERE name = '$name'";
$result = mysqli_query($conn, $query);
```

### ✅ সঠিক পদ্ধতি (PDO Prepared Statements)

```php
// SAFE - Parameterized query
$stmt = $pdo->prepare("SELECT * FROM products WHERE name = ?");
$stmt->execute([$name]);
$result = $stmt->fetchAll();

// Named parameters
$stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = :uid AND status = :status");
$stmt->execute(['uid' => $userId, 'status' => 'pending']);

// LIKE queries (escape wildcards)
$searchTerm = Sanitizer::escapeLike($input);
$stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ?");
$stmt->execute(["%$searchTerm%"]);

// IN clause (safe way)
$ids = ['id1', 'id2', 'id3'];
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare("SELECT * FROM products WHERE id IN ($placeholders)");
$stmt->execute($ids);
```

### Database User Permissions

```sql
-- Production user: minimal permissions
CREATE USER 'artistiya_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON artistiya_store.* TO 'artistiya_app'@'localhost';

-- Admin user: for migrations only
CREATE USER 'artistiya_admin'@'localhost' IDENTIFIED BY 'admin_password';
GRANT ALL PRIVILEGES ON artistiya_store.* TO 'artistiya_admin'@'localhost';

FLUSH PRIVILEGES;
```

---

## XSS প্রতিরোধ

### Output Encoding

```php
// HTML context
echo htmlspecialchars($userInput, ENT_QUOTES | ENT_HTML5, 'UTF-8');

// JavaScript context
echo json_encode($userInput, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);

// URL context
echo urlencode($userInput);

// CSS context - avoid user input in CSS entirely
```

### Content Security Policy

```php
header("Content-Security-Policy: default-src 'self'; " .
       "script-src 'self' https://cdn.jsdelivr.net; " .
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
       "img-src 'self' data: https: blob:; " .
       "font-src 'self' https://fonts.gstatic.com; " .
       "connect-src 'self' https://sandbox.sslcommerz.com https://tokenized.sandbox.bka.sh; " .
       "frame-src 'none'; " .
       "object-src 'none'");
```

---

## CSRF প্রতিরোধ

### Form-based CSRF Token

```php
// In form
<form method="POST" action="/api/orders.php">
    <?= CSRF::htmlInput() ?>
    <!-- form fields -->
</form>

// In API handler
if (!CSRF::validate($_POST['_csrf_token'] ?? '')) {
    http_response_code(403);
    exit('Invalid CSRF token');
}
```

### AJAX CSRF (Meta Tag Approach)

```php
// In HTML head
<meta name="csrf-token" content="<?= CSRF::generateToken() ?>">

// In JavaScript
fetch('/api/orders.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify(data)
});

// In PHP API
$token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!CSRF::validate($token)) {
    http_response_code(403);
    exit(json_encode(['error' => 'CSRF validation failed']));
}
```

---

## Authentication সিকিউরিটি

### Password Hashing

```php
// ALWAYS use Argon2id (or bcrypt as fallback)
$hash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,  // 64MB
    'time_cost'   => 4,
    'threads'     => 3,
]);

// Verification
if (password_verify($inputPassword, $storedHash)) {
    // Rehash if algorithm parameters changed
    if (password_needs_rehash($storedHash, PASSWORD_ARGON2ID)) {
        $newHash = password_hash($inputPassword, PASSWORD_ARGON2ID);
        // Update in database
    }
}
```

### Session Security

```php
// php.ini or runtime
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', '1');
ini_set('session.gc_maxlifetime', '3600');

session_start();
session_regenerate_id(true); // Prevent session fixation
```

---

## পেমেন্ট সিকিউরিটি

### Critical Rules

1. **কখনও client-side price trust করবেন না** — সর্বদা DB থেকে verify
2. **IPN/Callback-এ amount verify করুন** — order total-এর সাথে match করুন
3. **Idempotency** — duplicate payment processing রোধ করুন
4. **Credential encryption** — AES-256-GCM ব্যবহার করুন

### Payment Verification Pattern

```php
function verifyPaymentAmount(string $orderId, float $paidAmount): bool
{
    $order = Database::fetchOne("SELECT total, status FROM orders WHERE id = ?", [$orderId]);
    
    if (!$order) return false;
    if ($order['status'] !== 'pending') return false; // Already processed
    if (abs($order['total'] - $paidAmount) > 1) return false; // Amount mismatch (1 BDT tolerance)
    
    return true;
}
```

### Webhook Signature Verification

```php
function verifyWebhookSignature(string $payload, string $signature, string $secret): bool
{
    $expected = hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}
```

---

## ডেটা এনক্রিপশন

### Encryption at Rest

সকল সেনসিটিভ ডেটা (API keys, passwords, credentials) AES-256-GCM দিয়ে encrypt করুন:

```php
// Store
$encrypted = Encryption::encrypt($apiKey);
Database::update('payment_providers', ['store_id' => $encrypted], $providerId);

// Retrieve
$provider = Database::fetchOne("SELECT store_id FROM payment_providers WHERE id = ?", [$id]);
$apiKey = Encryption::decrypt($provider['store_id']);
```

### Encryption Key Management

```env
# .env - 32-byte hex key
CREDENTIALS_ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

- Key rotate করুন quarterly
- Key backup সিকিউরভাবে রাখুন (offline)
- .env ফাইল git-এ push করবেন না

---

## Server Hardening

### Nginx Security Config

```nginx
server {
    listen 443 ssl http2;
    server_name artistiya.store;

    ssl_certificate /etc/letsencrypt/live/artistiya.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artistiya.store/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Block sensitive files
    location ~ /\.(env|git|htaccess) {
        deny all;
        return 404;
    }

    location ~ /(config|src|vendor|storage/logs)/ {
        deny all;
        return 404;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
}
```

### MySQL Hardening

```sql
-- Disable remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test databases
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Enable binary logging for audit
SET GLOBAL log_bin = ON;
SET GLOBAL binlog_format = 'ROW';

FLUSH PRIVILEGES;
```

---

## OWASP Top 10 চেকলিস্ট

| # | ঝুঁকি | সমাধান | স্ট্যাটাস |
|---|--------|--------|-----------|
| A01 | Broken Access Control | Role-based auth, admin check on every endpoint | ✅ |
| A02 | Cryptographic Failures | AES-256-GCM, Argon2id, TLS 1.2+ | ✅ |
| A03 | Injection | PDO prepared statements everywhere | ✅ |
| A04 | Insecure Design | Server-side price verification, rate limiting | ✅ |
| A05 | Security Misconfiguration | .htaccess, security headers, no debug in prod | ✅ |
| A06 | Vulnerable Components | Composer audit, keep PHP/MySQL updated | ⚠️ Manual |
| A07 | Auth Failures | Rate limiting, strong passwords, session security | ✅ |
| A08 | Data Integrity | Payment amount verification, HMAC webhooks | ✅ |
| A09 | Logging & Monitoring | Error logging, fraud detection flags | ✅ |
| A10 | SSRF | Validate URLs, whitelist allowed domains | ✅ |

---

## Emergency Response

### Suspected Breach

```bash
# 1. Block all traffic temporarily
sudo iptables -A INPUT -p tcp --dport 80 -j DROP
sudo iptables -A INPUT -p tcp --dport 443 -j DROP

# 2. Check logs
tail -f /var/log/apache2/error.log
tail -f storage/logs/app.log

# 3. Change all credentials
mysql -u root -p -e "ALTER USER 'artistiya_app'@'localhost' IDENTIFIED BY 'new_password';"

# 4. Rotate encryption key
# Update .env CREDENTIALS_ENCRYPTION_KEY
# Re-encrypt all credentials in payment_providers & delivery_providers

# 5. Restore service
sudo iptables -D INPUT -p tcp --dport 80 -j DROP
sudo iptables -D INPUT -p tcp --dport 443 -j DROP
```
