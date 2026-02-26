# Artistiya E-Commerce: PHP/MySQL Migration Guide

## Table of Contents
1. [Requirements](#requirements)
2. [Hosting Setup](#hosting-setup)
3. [Database Migration](#database-migration)
4. [PHP Configuration](#php-configuration)
5. [Authentication System](#authentication-system)
6. [API Endpoints](#api-endpoints)
7. [Payment Gateways](#payment-gateways)
8. [Delivery API](#delivery-api)
9. [Email System (Hostinger SMTP)](#email-system-hostinger-smtp)
10. [SMS System](#sms-system)
11. [Security](#security)
12. [File Upload](#file-upload)

---

## Requirements

| Component | Minimum Version |
|-----------|----------------|
| PHP | 8.1+ |
| MySQL | 8.0+ |
| Composer | 2.x |
| Apache/Nginx | Latest stable |
| SSL Certificate | Required (Let's Encrypt) |
| PHP Extensions | pdo_mysql, openssl, mbstring, json, curl, gd/imagick, fileinfo |

---

## Hosting Setup (Hostinger/cPanel)

### 1. Create Database

```
1. cPanel > MySQL Databases > Create New Database
2. Database name: artistiya_store
3. Create user: artistiya_user
4. Add user to database with ALL PRIVILEGES
```

### 2. Set PHP Version

```
cPanel > PHP Version > Select PHP 8.1+
Enable extensions: pdo_mysql, openssl, mbstring, curl, gd
```

### 3. SSL Certificate

```
cPanel > SSL/TLS > Let's Encrypt > Install
Redirect all HTTP requests to HTTPS
```

---

## Database Migration

### Step 1: Import MySQL Schema

```bash
mysql -u artistiya_user -p artistiya_store < docs/migration/DATABASE_SCHEMA_MYSQL.sql
```

### Step 2: Export Data from Supabase

Supabase Dashboard > SQL Editor:
```sql
-- Export each table as CSV
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM categories) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;
-- ... repeat for all tables
```

### Step 3: Import Data to MySQL

```bash
# Import CSV files
LOAD DATA INFILE '/path/to/products.csv'
INTO TABLE products
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

### Step 4: UUID Migration

Supabase UUIDs to MySQL UUIDs: No changes needed as MySQL 8.0+ supports UUID() natively.

---

## PHP Configuration

### File Structure

```
artistiya/
├── config/
│   ├── database.php          # DB connection
│   ├── app.php               # App settings
│   ├── payment.php           # Payment gateway config
│   ├── delivery.php          # Delivery API config
│   └── security.php          # Security settings
├── src/
│   ├── Database.php          # PDO wrapper
│   ├── Auth.php              # Authentication
│   ├── CSRF.php              # CSRF protection
│   ├── RateLimit.php         # Rate limiting
│   ├── Encryption.php        # AES-256 encryption
│   ├── Sanitizer.php         # Input sanitization
│   ├── EmailService.php      # PHPMailer SMTP (Hostinger)
│   ├── EmailTemplateEngine.php # Email template rendering
│   ├── EmailQueue.php        # Email queue system
│   ├── OrderEmailService.php # Order email automation
│   ├── SMSService.php        # SMS gateway integration
│   ├── SMSTemplateEngine.php # SMS message templates
│   ├── OrderSMSService.php   # Order SMS automation
│   ├── OTPService.php        # OTP generation & verification
│   ├── OrderService.php      # Order processing
│   ├── PaymentService.php    # Payment handling
│   └── DeliveryService.php   # Delivery API
├── api/
│   ├── orders.php            # Order API
│   ├── products.php          # Product API
│   ├── auth.php              # Auth API
│   ├── email.php             # Email API
│   ├── sms.php               # SMS API
│   ├── otp.php               # OTP API
│   ├── payment-callback.php  # Payment IPN/callback
│   └── delivery-webhook.php  # Delivery webhooks
├── templates/
│   └── emails/               # HTML email templates
├── cron/
│   └── process-email-queue.php # Cron job (email queue)
├── public/
│   ├── index.php             # Entry point
│   ├── .htaccess             # Apache rules
│   └── assets/               # Static files
├── storage/
│   ├── uploads/              # User uploads
│   └── logs/                 # Application logs
├── vendor/                   # Composer packages
├── composer.json
└── .env                      # Environment variables
```

### `.env` File

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=artistiya_store
DB_USER=artistiya_user
DB_PASS=your_secure_password_here
DB_CHARSET=utf8mb4

# App
APP_URL=https://artistiya.store
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your_32_byte_random_key_here

# Hostinger SMTP Email (Official Settings)
# Source: hPanel > Emails > Connect Apps & Devices > Manual Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_ENCRYPTION=ssl
SMTP_USER=info@artistiya.store
SMTP_PASS=your_email_password
SMTP_FROM_EMAIL=info@artistiya.store
SMTP_FROM_NAME=Artistiya
SMTP_REPLY_TO=support@artistiya.store

# SMS Gateway (Dynamic — configure in admin panel)
SMS_PROVIDER=twilio
SMS_API_KEY=
SMS_API_SECRET=
SMS_SENDER_ID=Artistiya

# Encryption
CREDENTIALS_ENCRYPTION_KEY=your_32_byte_hex_key

# Payment Gateways (encrypted in DB, these are fallbacks)
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASS=
BKASH_APP_KEY=
BKASH_APP_SECRET=
NAGAD_MERCHANT_ID=
NAGAD_MERCHANT_KEY=

# Delivery
PATHAO_API_KEY=
STEADFAST_API_KEY=
```

### `config/database.php`

```php
<?php
// Database Configuration
return [
    'driver'    => 'mysql',
    'host'      => getenv('DB_HOST') ?: 'localhost',
    'port'      => getenv('DB_PORT') ?: '3306',
    'database'  => getenv('DB_NAME') ?: 'artistiya_store',
    'username'  => getenv('DB_USER') ?: 'root',
    'password'  => getenv('DB_PASS') ?: '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'options'   => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ],
];
```

### `src/Database.php` — PDO Wrapper (Injection-Proof)

```php
<?php
declare(strict_types=1);

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../config/database.php';
            $dsn = sprintf(
                '%s:host=%s;port=%s;dbname=%s;charset=%s',
                $config['driver'],
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );
            self::$instance = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        }
        return self::$instance;
    }

    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function insert(string $table, array $data): string
    {
        $id = self::generateUUID();
        $data['id'] = $id;
        $columns = implode(', ', array_map(fn($k) => "`$k`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        self::query("INSERT INTO `$table` ($columns) VALUES ($placeholders)", array_values($data));
        return $id;
    }

    public static function update(string $table, array $data, string $id): bool
    {
        $sets = implode(', ', array_map(fn($k) => "`$k` = ?", array_keys($data)));
        $values = array_values($data);
        $values[] = $id;
        $stmt = self::query("UPDATE `$table` SET $sets WHERE id = ?", $values);
        return $stmt->rowCount() > 0;
    }

    public static function delete(string $table, string $id): bool
    {
        $stmt = self::query("DELETE FROM `$table` WHERE id = ?", [$id]);
        return $stmt->rowCount() > 0;
    }

    private static function generateUUID(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
```

---

## Authentication System

### `src/Auth.php`

```php
<?php
declare(strict_types=1);

class Auth
{
    public static function register(string $email, string $password, string $fullName): array
    {
        $email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
        if (!$email) throw new \InvalidArgumentException('Invalid email');
        if (strlen($password) < 8) throw new \InvalidArgumentException('Password must be at least 8 characters');

        $existing = Database::fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
        if ($existing) throw new \RuntimeException('Email already registered');

        $userId = Database::insert('users', [
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_ARGON2ID, [
                'memory_cost' => 65536, 'time_cost' => 4, 'threads' => 3,
            ]),
        ]);

        Database::insert('profiles', [
            'user_id' => $userId,
            'full_name' => Sanitizer::cleanString($fullName, 100),
            'email' => $email,
        ]);

        Database::insert('user_roles', ['user_id' => $userId, 'role' => 'customer']);
        return ['user_id' => $userId, 'email' => $email];
    }

    public static function login(string $email, string $password, string $ip): array
    {
        RateLimit::check($ip, 'login', 5, 900);
        $user = Database::fetchOne("SELECT id, email, password_hash FROM users WHERE email = ?", [$email]);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            RateLimit::increment($ip, 'login');
            throw new \RuntimeException('Invalid credentials');
        }

        $token = self::generateToken($user['id']);
        RateLimit::reset($ip, 'login');
        return ['token' => $token, 'user_id' => $user['id']];
    }

    public static function isAdmin(string $userId): bool
    {
        $role = Database::fetchOne("SELECT id FROM user_roles WHERE user_id = ? AND role = 'admin'", [$userId]);
        return $role !== null;
    }

    private static function generateToken(string $userId): string
    {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode(['sub' => $userId, 'iat' => time(), 'exp' => time() + 86400]));
        $signature = hash_hmac('sha256', "$header.$payload", getenv('APP_KEY'));
        return "$header.$payload.$signature";
    }

    public static function validateToken(string $token): ?string
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$header, $payload, $signature] = $parts;
        $expectedSig = hash_hmac('sha256', "$header.$payload", getenv('APP_KEY'));
        if (!hash_equals($expectedSig, $signature)) return null;
        $data = json_decode(base64_decode($payload), true);
        if (!$data || ($data['exp'] ?? 0) < time()) return null;
        return $data['sub'] ?? null;
    }
}
```

---

## Security

### `src/Sanitizer.php`

```php
<?php
declare(strict_types=1);

class Sanitizer
{
    public static function cleanString(string $input, int $maxLen = 500): string
    {
        $clean = strip_tags($input);
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return mb_substr(trim($clean), 0, $maxLen);
    }

    public static function isValidPhone(string $phone): bool
    {
        $clean = preg_replace('/[\s\-]/', '', $phone);
        return (bool) preg_match('/^01[3-9]\d{8}$/', $clean);
    }

    public static function cleanPhone(string $phone): string
    {
        return preg_replace('/[\s\-]/', '', $phone);
    }

    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function escapeLike(string $value): string
    {
        return str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $value);
    }
}
```

### `src/CSRF.php`

```php
<?php
declare(strict_types=1);

class CSRF
{
    public static function generateToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_time'] = time();
        return $token;
    }

    public static function validate(string $token): bool
    {
        if (empty($_SESSION['csrf_token'])) return false;
        if (!hash_equals($_SESSION['csrf_token'], $token)) return false;
        if ((time() - ($_SESSION['csrf_time'] ?? 0)) > 3600) return false;
        unset($_SESSION['csrf_token'], $_SESSION['csrf_time']);
        return true;
    }
}
```

### `src/RateLimit.php`

```php
<?php
declare(strict_types=1);

class RateLimit
{
    public static function check(string $identifier, string $action, int $maxAttempts, int $windowSeconds): void
    {
        $record = Database::fetchOne(
            "SELECT attempts, last_attempt_at, blocked_until FROM rate_limits WHERE identifier = ? AND action = ?",
            [$identifier, $action]
        );
        if ($record) {
            if ($record['blocked_until'] && strtotime($record['blocked_until']) > time()) {
                throw new \RuntimeException('Too many attempts. Try again later.');
            }
            $windowStart = date('Y-m-d H:i:s', time() - $windowSeconds);
            if ($record['last_attempt_at'] > $windowStart && $record['attempts'] >= $maxAttempts) {
                Database::query(
                    "UPDATE rate_limits SET blocked_until = ? WHERE identifier = ? AND action = ?",
                    [date('Y-m-d H:i:s', time() + $windowSeconds), $identifier, $action]
                );
                throw new \RuntimeException('Too many attempts. Try again later.');
            }
        }
    }

    public static function increment(string $identifier, string $action): void
    {
        Database::query(
            "INSERT INTO rate_limits (identifier, action, attempts, last_attempt_at)
             VALUES (?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt_at = NOW()",
            [$identifier, $action]
        );
    }

    public static function reset(string $identifier, string $action): void
    {
        Database::query("DELETE FROM rate_limits WHERE identifier = ? AND action = ?", [$identifier, $action]);
    }
}
```

### `src/Encryption.php` — AES-256

```php
<?php
declare(strict_types=1);

class Encryption
{
    private static function getKey(): string
    {
        $key = getenv('CREDENTIALS_ENCRYPTION_KEY');
        if (!$key) throw new \RuntimeException('Encryption key not configured');
        return hex2bin($key);
    }

    public static function encrypt(string $plaintext): string
    {
        $key = self::getKey();
        $iv = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return 'enc:' . base64_encode($iv . $tag . $ciphertext);
    }

    public static function decrypt(string $encrypted): string
    {
        if (!str_starts_with($encrypted, 'enc:')) return $encrypted;
        $key = self::getKey();
        $data = base64_decode(substr($encrypted, 4));
        $iv = substr($data, 0, 12);
        $tag = substr($data, 12, 16);
        $ciphertext = substr($data, 28);
        $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        if ($plaintext === false) throw new \RuntimeException('Decryption failed');
        return $plaintext;
    }
}
```

---

## API Endpoints

### `api/orders.php` — Secure Order Processing

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit(json_encode(['error' => 'Method not allowed']));
    }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid JSON']));
    }

    $items = $body['items'] ?? [];
    $address = $body['address'] ?? [];
    $paymentMethod = $body['payment_method'] ?? '';
    $promoCode = $body['promo_code'] ?? null;
    $notes = $body['notes'] ?? null;

    // Validation
    if (empty($items) || count($items) > 50) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid cart items']));
    }

    if (empty($address['full_name']) || empty($address['phone'])) {
        http_response_code(400);
        exit(json_encode(['error' => 'Name and phone required']));
    }

    $cleanPhone = Sanitizer::cleanPhone($address['phone']);
    if (!Sanitizer::isValidPhone($cleanPhone)) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid phone number']));
    }

    $validMethods = ['cod', 'bkash', 'nagad', 'bank_transfer', 'sslcommerz', 'aamarpay', 'surjopay'];
    if (!in_array($paymentMethod, $validMethods)) {
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid payment method']));
    }

    // Blocked customer check
    $blocked = Database::fetchOne("SELECT id FROM blocked_customers WHERE phone = ? AND is_active = 1", [$cleanPhone]);
    if ($blocked) {
        http_response_code(403);
        exit(json_encode(['error' => 'Order cannot be processed. Contact support.']));
    }

    // Rate limiting by phone
    RateLimit::check($cleanPhone, 'order', 5, 86400);

    // Server-side price verification
    $productIds = array_unique(array_column($items, 'product_id'));
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $products = Database::fetchAll(
        "SELECT id, name, price, stock_quantity, is_preorderable, is_active FROM products WHERE id IN ($placeholders)",
        $productIds
    );
    $productMap = array_column($products, null, 'id');

    $serverSubtotal = 0;
    $verifiedItems = [];
    foreach ($items as $item) {
        $product = $productMap[$item['product_id']] ?? null;
        if (!$product || !$product['is_active']) {
            http_response_code(400);
            exit(json_encode(['error' => 'Product not found or inactive']));
        }
        $qty = max(1, min(100, intval($item['quantity'])));
        if ($product['stock_quantity'] < $qty && !$product['is_preorderable']) {
            http_response_code(400);
            exit(json_encode(['error' => "\"{$product['name']}\" out of stock"]));
        }
        $serverSubtotal += $product['price'] * $qty;
        $verifiedItems[] = [
            'product_id' => $product['id'],
            'product_name' => $product['name'],
            'product_price' => $product['price'],
            'quantity' => $qty,
            'is_preorder' => $product['stock_quantity'] < $qty,
        ];
    }

    // Shipping cost
    $shippingCost = 0;
    if (($body['shipping_method'] ?? '') !== 'pickup') {
        $zone = Database::fetchOne(
            "SELECT shipping_cost FROM delivery_zones WHERE district = ? AND is_active = 1 LIMIT 1",
            [Sanitizer::cleanString($address['district'] ?? '', 100)]
        );
        $shippingCost = $zone ? $zone['shipping_cost'] : 120;
        $checkoutSettings = Database::fetchOne("SELECT * FROM checkout_settings LIMIT 1");
        if ($checkoutSettings && $checkoutSettings['free_shipping_threshold']
            && $serverSubtotal >= $checkoutSettings['free_shipping_threshold']) {
            $shippingCost = 0;
        }
    }

    // Promo code
    $promoDiscount = 0;
    $promoId = null;
    if ($promoCode) {
        $promo = Database::fetchOne("SELECT * FROM promo_codes WHERE code = ? AND is_active = 1", [strtoupper(trim($promoCode))]);
        if ($promo) {
            $now = time();
            $valid = (!$promo['expires_at'] || strtotime($promo['expires_at']) > $now)
                  && (!$promo['starts_at'] || strtotime($promo['starts_at']) <= $now)
                  && (!$promo['usage_limit'] || $promo['used_count'] < $promo['usage_limit'])
                  && (!$promo['min_order_amount'] || $serverSubtotal >= $promo['min_order_amount']);
            if ($valid) {
                if ($promo['discount_type'] === 'percentage') {
                    $promoDiscount = round($serverSubtotal * ($promo['discount_value'] / 100));
                    if ($promo['max_discount_amount'] && $promoDiscount > $promo['max_discount_amount']) {
                        $promoDiscount = $promo['max_discount_amount'];
                    }
                } else {
                    $promoDiscount = $promo['discount_value'];
                }
                $promoId = $promo['id'];
            }
        }
    }

    // COD extra charge
    $codCharge = 0;
    if ($paymentMethod === 'cod') {
        $cs = Database::fetchOne("SELECT cod_extra_charge FROM checkout_settings LIMIT 1");
        $codCharge = $cs['cod_extra_charge'] ?? 0;
    }

    $serverTotal = max(0, $serverSubtotal + $shippingCost + $codCharge - $promoDiscount);

    // Create address
    $addressId = Database::insert('addresses', [
        'user_id' => $body['user_id'] ?? '00000000-0000-0000-0000-000000000001',
        'full_name' => Sanitizer::cleanString($address['full_name'], 100),
        'phone' => $cleanPhone,
        'division' => Sanitizer::cleanString($address['division'] ?? 'N/A', 50),
        'district' => Sanitizer::cleanString($address['district'] ?? 'N/A', 50),
        'thana' => Sanitizer::cleanString($address['thana'] ?? 'N/A', 50),
        'address_line' => Sanitizer::cleanString($address['address_line'] ?? 'N/A', 300),
    ]);

    // Create order
    $orderNumber = 'ORD-' . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $orderId = Database::insert('orders', [
        'order_number' => $orderNumber,
        'user_id' => $body['user_id'] ?? null,
        'address_id' => $addressId,
        'payment_method' => $paymentMethod,
        'subtotal' => $serverSubtotal,
        'shipping_cost' => $shippingCost,
        'total' => $serverTotal,
        'discount_amount' => $promoDiscount,
        'promo_code_id' => $promoId,
        'notes' => $notes ? Sanitizer::cleanString($notes, 500) : null,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);

    // Create order items
    foreach ($verifiedItems as $item) {
        Database::insert('order_items', [
            'order_id' => $orderId,
            'product_id' => $item['product_id'],
            'product_name' => $item['product_name'],
            'product_price' => $item['product_price'],
            'quantity' => $item['quantity'],
            'is_preorder' => $item['is_preorder'] ? 1 : 0,
        ]);
    }

    // Update promo usage
    if ($promoId) {
        Database::query("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", [$promoId]);
    }

    RateLimit::increment($cleanPhone, 'order');

    // Send automatic email confirmation
    OrderEmailService::sendOrderConfirmation($orderId);

    // Send automatic SMS confirmation
    OrderSMSService::sendOrderConfirmation($orderId);

    echo json_encode([
        'success' => true,
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'total' => $serverTotal,
    ]);

} catch (\Throwable $e) {
    error_log("Order error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred.']);
}
```

---

## Payment Gateways

### SSLCommerz (PHP)

```php
<?php
class SSLCommerzPayment
{
    private string $storeId;
    private string $storePass;
    private string $baseUrl;

    public function __construct()
    {
        $provider = Database::fetchOne(
            "SELECT * FROM payment_providers WHERE provider_type = 'sslcommerz' AND is_active = 1"
        );
        $this->storeId = Encryption::decrypt($provider['store_id']);
        $this->storePass = Encryption::decrypt($provider['store_password']);
        $this->baseUrl = ($provider['is_sandbox'] ?? true)
            ? 'https://sandbox.sslcommerz.com'
            : 'https://securepay.sslcommerz.com';
    }

    public function initiatePayment(string $orderId, float $amount, array $customer): array
    {
        $postData = [
            'store_id'     => $this->storeId,
            'store_passwd' => $this->storePass,
            'total_amount' => $amount,
            'currency'     => 'BDT',
            'tran_id'      => $orderId,
            'success_url'  => getenv('APP_URL') . '/api/payment-callback.php?gateway=sslcommerz&status=success',
            'fail_url'     => getenv('APP_URL') . '/api/payment-callback.php?gateway=sslcommerz&status=fail',
            'cancel_url'   => getenv('APP_URL') . '/api/payment-callback.php?gateway=sslcommerz&status=cancel',
            'ipn_url'      => getenv('APP_URL') . '/api/payment-callback.php?gateway=sslcommerz&type=ipn',
            'cus_name'     => $customer['name'],
            'cus_email'    => $customer['email'] ?? 'customer@artistiya.store',
            'cus_phone'    => $customer['phone'],
            'cus_add1'     => $customer['address'] ?? 'Bangladesh',
            'cus_city'     => $customer['district'] ?? 'Dhaka',
            'cus_country'  => 'Bangladesh',
            'shipping_method' => 'NO',
            'product_name'    => 'Artistiya Order',
            'product_category'=> 'Handcraft',
            'product_profile' => 'general',
        ];

        $ch = curl_init($this->baseUrl . '/gwprocess/v4/api.php');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if ($response['status'] !== 'SUCCESS') throw new \RuntimeException('Payment initiation failed');
        return ['gateway_url' => $response['GatewayPageURL'], 'session_key' => $response['sessionkey']];
    }
}
```

### bKash Tokenized Checkout (PHP)

```php
<?php
class BkashPayment
{
    private string $appKey;
    private string $appSecret;
    private string $username;
    private string $password;
    private string $baseUrl;

    public function __construct()
    {
        $provider = Database::fetchOne("SELECT * FROM payment_providers WHERE provider_type = 'bkash' AND is_active = 1");
        $config = json_decode($provider['config'] ?? '{}', true);
        $this->appKey    = Encryption::decrypt($config['app_key'] ?? '');
        $this->appSecret = Encryption::decrypt($config['app_secret'] ?? '');
        $this->username  = Encryption::decrypt($config['username'] ?? '');
        $this->password  = Encryption::decrypt($config['password'] ?? '');
        $this->baseUrl   = ($provider['is_sandbox'] ?? true)
            ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
            : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
    }

    public function grantToken(): string
    {
        $response = $this->apiCall('/tokenized/checkout/token/grant', [
            'app_key' => $this->appKey, 'app_secret' => $this->appSecret,
        ], ['username' => $this->username, 'password' => $this->password]);
        return $response['id_token'];
    }

    public function createPayment(string $token, string $orderId, float $amount): array
    {
        return $this->apiCall('/tokenized/checkout/create', [
            'mode' => '0011', 'payerReference' => $orderId,
            'callbackURL' => getenv('APP_URL') . '/api/payment-callback.php?gateway=bkash',
            'amount' => number_format($amount, 2, '.', ''),
            'currency' => 'BDT', 'intent' => 'sale',
            'merchantInvoiceNumber' => $orderId,
        ], [], $token);
    }

    private function apiCall(string $endpoint, array $body, array $headers = [], ?string $token = null): array
    {
        $ch = curl_init($this->baseUrl . $endpoint);
        $curlHeaders = ['Content-Type: application/json', 'Accept: application/json'];
        if ($token) {
            $curlHeaders[] = "Authorization: $token";
            $curlHeaders[] = "X-APP-Key: {$this->appKey}";
        }
        foreach ($headers as $k => $v) { $curlHeaders[] = "$k: $v"; }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => $curlHeaders, CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return $response;
    }
}
```

---

## Email System (Hostinger SMTP)

### `src/EmailService.php`

```php
<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private string $host;
    private int $port;
    private string $encryption;
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;
    private string $replyTo;

    public function __construct()
    {
        $this->host       = getenv('SMTP_HOST') ?: 'smtp.hostinger.com';
        $this->port       = (int)(getenv('SMTP_PORT') ?: 465);
        $this->encryption = getenv('SMTP_ENCRYPTION') ?: 'ssl';
        $this->username   = getenv('SMTP_USER') ?: '';
        $this->password   = getenv('SMTP_PASS') ?: '';
        $this->fromEmail  = getenv('SMTP_FROM_EMAIL') ?: $this->username;
        $this->fromName   = getenv('SMTP_FROM_NAME') ?: 'Artistiya';
        $this->replyTo    = getenv('SMTP_REPLY_TO') ?: $this->fromEmail;
    }

    /**
     * Send email via configured provider (Hostinger SMTP or Resend API)
     */
    public function send(string $to, string $subject, string $htmlBody, array $options = []): bool
    {
        try {
            // Check DB settings (admin panel overrides .env)
            $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
            if ($settings && !$settings['is_enabled']) return false;

            if ($settings) {
                if ($settings['smtp_host']) $this->host = $settings['smtp_host'];
                if ($settings['smtp_port']) $this->port = (int)$settings['smtp_port'];
                if ($settings['smtp_user']) $this->username = Encryption::decrypt($settings['smtp_user']);
                if ($settings['smtp_password']) $this->password = Encryption::decrypt($settings['smtp_password']);
                if ($settings['from_email']) $this->fromEmail = $settings['from_email'];
                if ($settings['from_name']) $this->fromName = $settings['from_name'];
                if ($settings['reply_to_email']) $this->replyTo = $settings['reply_to_email'];
            }

            if (($settings['provider'] ?? 'smtp') === 'resend') {
                return $this->sendViaResend($to, $subject, $htmlBody, $settings['resend_api_key'] ?? '');
            }

            return $this->sendViaPHPMailer($to, $subject, $htmlBody, $options);
        } catch (\Throwable $e) {
            error_log("Email error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send via PHPMailer with Hostinger SMTP
     * Official: smtp.hostinger.com | Port 465 (SSL) or 587 (TLS/STARTTLS)
     */
    private function sendViaPHPMailer(string $to, string $subject, string $htmlBody, array $options = []): bool
    {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $this->host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $this->username;
        $mail->Password   = $this->password;
        $mail->Port       = $this->port;

        if ($this->encryption === 'ssl' || $this->port === 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($this->encryption === 'tls' || $this->port === 587) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        $mail->SMTPDebug = (getenv('APP_DEBUG') === 'true') ? SMTP::DEBUG_SERVER : SMTP::DEBUG_OFF;
        $mail->setFrom($this->fromEmail, $this->fromName);
        $mail->addReplyTo($this->replyTo, $this->fromName);

        $recipients = is_array($to) ? $to : [$to];
        foreach ($recipients as $recipient) { $mail->addAddress(trim($recipient)); }

        if (!empty($options['cc'])) {
            foreach ((array)$options['cc'] as $cc) { $mail->addCC(trim($cc)); }
        }
        if (!empty($options['bcc'])) {
            foreach ((array)$options['bcc'] as $bcc) { $mail->addBCC(trim($bcc)); }
        }

        $mail->isHTML(true);
        $mail->CharSet  = 'UTF-8';
        $mail->Encoding = 'base64';
        $mail->Subject  = $subject;
        $mail->Body     = $htmlBody;
        $mail->AltBody  = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $htmlBody));

        if (!empty($options['attachments'])) {
            foreach ($options['attachments'] as $attachment) {
                if (is_array($attachment)) {
                    $mail->addAttachment($attachment['path'], $attachment['name'] ?? '');
                } else {
                    $mail->addAttachment($attachment);
                }
            }
        }

        $mail->send();
        $this->logEmailSent($to, $subject, 'hostinger_smtp');
        return true;
    }

    /**
     * Send via Resend API (fallback / alternative provider)
     */
    private function sendViaResend(string $to, string $subject, string $htmlBody, string $apiKey): bool
    {
        $decryptedKey = Encryption::decrypt($apiKey);
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', "Authorization: Bearer $decryptedKey"],
            CURLOPT_POSTFIELDS     => json_encode([
                'from' => "{$this->fromName} <{$this->fromEmail}>",
                'to' => [$to], 'subject' => $subject, 'html' => $htmlBody,
                'reply_to' => $this->replyTo,
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) throw new \RuntimeException('Resend API error: ' . json_encode($response));
        $this->logEmailSent($to, $subject, 'resend');
        return true;
    }

    private function logEmailSent(string $to, string $subject, string $provider): void
    {
        try {
            Database::insert('email_log', [
                'recipient' => is_array($to) ? implode(', ', $to) : $to,
                'subject'   => mb_substr($subject, 0, 500),
                'provider'  => $provider,
                'status'    => 'sent',
                'sent_at'   => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            error_log("Email log error: " . $e->getMessage());
        }
    }

    /**
     * Test SMTP connection (callable from admin panel)
     */
    public function testConnection(): array
    {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->Port       = $this->port;
            $mail->SMTPSecure = ($this->port === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->smtpConnect();
            $mail->smtpClose();
            return ['success' => true, 'message' => 'SMTP connection successful!'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => "SMTP connection failed: {$mail->ErrorInfo}"];
        }
    }
}
```

### `src/EmailTemplateEngine.php`

```php
<?php
declare(strict_types=1);

class EmailTemplateEngine
{
    public static function render(string $templateKey, array $variables = []): string
    {
        $template = Database::fetchOne(
            "SELECT html_content FROM email_templates WHERE template_key = ? AND is_active = 1",
            [$templateKey]
        );
        if ($template) return self::replaceVariables($template['html_content'], $variables);

        $filePath = __DIR__ . "/../templates/emails/{$templateKey}.html";
        if (file_exists($filePath)) return self::replaceVariables(file_get_contents($filePath), $variables);

        throw new \RuntimeException("Email template not found: $templateKey");
    }

    private static function replaceVariables(string $html, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $html = str_replace('{{' . $key . '}}', htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'), $html);
        }
        $branding = Database::fetchOne("SELECT * FROM site_branding LIMIT 1");
        if ($branding) {
            $html = str_replace('{{site_name}}', htmlspecialchars($branding['site_name'] ?? 'Artistiya', ENT_QUOTES, 'UTF-8'), $html);
            $html = str_replace('{{site_url}}', htmlspecialchars(getenv('APP_URL') ?: '', ENT_QUOTES, 'UTF-8'), $html);
            $html = str_replace('{{site_logo}}', htmlspecialchars($branding['logo_url'] ?? '', ENT_QUOTES, 'UTF-8'), $html);
            $html = str_replace('{{site_phone}}', htmlspecialchars($branding['phone'] ?? '', ENT_QUOTES, 'UTF-8'), $html);
            $html = str_replace('{{site_email}}', htmlspecialchars($branding['email'] ?? '', ENT_QUOTES, 'UTF-8'), $html);
        }
        $html = str_replace('{{year}}', date('Y'), $html);
        return $html;
    }

    public static function renderSubject(string $templateKey, array $variables = []): string
    {
        $template = Database::fetchOne(
            "SELECT subject FROM email_templates WHERE template_key = ? AND is_active = 1",
            [$templateKey]
        );
        $subject = $template['subject'] ?? self::getDefaultSubject($templateKey);
        foreach ($variables as $key => $value) {
            $subject = str_replace('{{' . $key . '}}', (string)$value, $subject);
        }
        return $subject;
    }

    private static function getDefaultSubject(string $key): string
    {
        return match ($key) {
            'order-confirmation' => 'Order Confirmation — #{{order_number}}',
            'order-shipped'      => 'Your Order Has Been Shipped — #{{order_number}}',
            'order-delivered'    => 'Order Delivered — #{{order_number}}',
            'password-reset'     => 'Password Reset — Artistiya',
            'welcome'            => 'Welcome to Artistiya!',
            'newsletter'         => 'Artistiya Newsletter',
            'otp-verification'   => 'Your Verification Code — Artistiya',
            default              => 'Artistiya — Notification',
        };
    }
}
```

### `src/EmailQueue.php`

```php
<?php
declare(strict_types=1);

class EmailQueue
{
    public static function enqueue(string $to, string $subject, string $htmlBody, int $priority = 5): string
    {
        return Database::insert('email_queue', [
            'recipient'    => $to,
            'subject'      => $subject,
            'html_body'    => $htmlBody,
            'priority'     => $priority,
            'status'       => 'pending',
            'attempts'     => 0,
            'max_attempts' => 3,
            'scheduled_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Cron Job: Process pending emails
     * crontab: * * * * * php /path/to/cron/process-email-queue.php
     */
    public static function processQueue(int $batchSize = 10): int
    {
        $emails = Database::fetchAll(
            "SELECT * FROM email_queue
             WHERE status = 'pending' AND attempts < max_attempts AND scheduled_at <= NOW()
             ORDER BY priority ASC, created_at ASC LIMIT ?",
            [$batchSize]
        );

        $sent = 0;
        $mailer = new EmailService();

        foreach ($emails as $email) {
            Database::update('email_queue', ['status' => 'processing', 'attempts' => $email['attempts'] + 1], $email['id']);

            try {
                $result = $mailer->send($email['recipient'], $email['subject'], $email['html_body']);
                Database::update('email_queue', [
                    'status' => $result ? 'sent' : 'failed',
                    'sent_at' => $result ? date('Y-m-d H:i:s') : null,
                    'error' => $result ? null : 'Send returned false',
                ], $email['id']);
                if ($result) $sent++;
            } catch (\Throwable $e) {
                Database::update('email_queue', [
                    'status' => ($email['attempts'] + 1 >= $email['max_attempts']) ? 'failed' : 'pending',
                    'error' => mb_substr($e->getMessage(), 0, 500),
                ], $email['id']);
            }

            usleep(200000); // 200ms delay (Hostinger rate limit)
        }
        return $sent;
    }
}
```

### `src/OrderEmailService.php`

```php
<?php
declare(strict_types=1);

class OrderEmailService
{
    public static function sendOrderConfirmation(string $orderId): bool
    {
        $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
        if ($settings && !$settings['send_order_confirmation']) return false;

        $order = self::getOrderData($orderId);
        if (!$order) return false;

        $html = EmailTemplateEngine::render('order-confirmation', [
            'customer_name'  => $order['customer_name'],
            'order_number'   => $order['order_number'],
            'order_date'     => date('d M Y, h:i A', strtotime($order['created_at'])),
            'items_html'     => self::buildItemsHtml($order['items']),
            'subtotal'       => number_format($order['subtotal'], 0),
            'shipping_cost'  => number_format($order['shipping_cost'], 0),
            'total'          => number_format($order['total'], 0),
            'payment_method' => self::getPaymentLabel($order['payment_method']),
            'address'        => self::formatAddress($order['address']),
            'track_url'      => getenv('APP_URL') . '/track-order?order=' . $order['order_number'],
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-confirmation', ['order_number' => $order['order_number']]);
        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 1);
        }
        return true;
    }

    public static function sendShippingUpdate(string $orderId, string $trackingNumber = '', string $courierName = ''): bool
    {
        $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
        if ($settings && !$settings['send_shipping_update']) return false;

        $order = self::getOrderData($orderId);
        if (!$order) return false;

        $html = EmailTemplateEngine::render('order-shipped', [
            'customer_name'   => $order['customer_name'],
            'order_number'    => $order['order_number'],
            'tracking_number' => $trackingNumber,
            'courier_name'    => $courierName,
            'track_url'       => getenv('APP_URL') . '/track-order?order=' . $order['order_number'],
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-shipped', ['order_number' => $order['order_number']]);
        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 2);
        }
        return true;
    }

    public static function sendDeliveryConfirmation(string $orderId): bool
    {
        $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
        if ($settings && !$settings['send_delivery_notification']) return false;

        $order = self::getOrderData($orderId);
        if (!$order) return false;

        $html = EmailTemplateEngine::render('order-delivered', [
            'customer_name' => $order['customer_name'],
            'order_number'  => $order['order_number'],
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-delivered', ['order_number' => $order['order_number']]);
        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 2);
        }
        return true;
    }

    public static function sendPasswordReset(string $email, string $resetToken): bool
    {
        $html = EmailTemplateEngine::render('password-reset', [
            'reset_url' => getenv('APP_URL') . '/auth?reset_token=' . $resetToken,
            'expires_in' => '1 hour',
        ]);
        $subject = EmailTemplateEngine::renderSubject('password-reset', []);
        return (new EmailService())->send($email, $subject, $html);
    }

    public static function sendWelcome(string $email, string $fullName): bool
    {
        $html = EmailTemplateEngine::render('welcome', [
            'customer_name' => $fullName,
            'shop_url'      => getenv('APP_URL') . '/shop',
        ]);
        $subject = EmailTemplateEngine::renderSubject('welcome', []);
        EmailQueue::enqueue($email, $subject, $html, 5);
        return true;
    }

    // ─── Helpers ───

    private static function getOrderData(string $orderId): ?array
    {
        $order = Database::fetchOne(
            "SELECT o.*, a.full_name, a.phone, a.division, a.district, a.thana, a.address_line
             FROM orders o LEFT JOIN addresses a ON o.address_id = a.id WHERE o.id = ?",
            [$orderId]
        );
        if (!$order) return null;

        $items = Database::fetchAll("SELECT * FROM order_items WHERE order_id = ?", [$orderId]);

        $customerEmail = null;
        if ($order['user_id']) {
            $customer = Database::fetchOne("SELECT email FROM customers WHERE user_id = ?", [$order['user_id']]);
            $customerEmail = $customer['email'] ?? null;
            if (!$customerEmail) {
                $profile = Database::fetchOne("SELECT email FROM profiles WHERE user_id = ?", [$order['user_id']]);
                $customerEmail = $profile['email'] ?? null;
            }
        }

        return [
            'order_number' => $order['order_number'], 'created_at' => $order['created_at'],
            'subtotal' => $order['subtotal'], 'shipping_cost' => $order['shipping_cost'],
            'total' => $order['total'], 'payment_method' => $order['payment_method'],
            'customer_name' => $order['full_name'] ?? 'Customer',
            'customer_email' => $customerEmail,
            'items' => $items,
            'address' => [
                'full_name' => $order['full_name'], 'phone' => $order['phone'],
                'division' => $order['division'], 'district' => $order['district'],
                'thana' => $order['thana'], 'address_line' => $order['address_line'],
            ],
        ];
    }

    private static function buildItemsHtml(array $items): string
    {
        $html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;">';
        $html .= '<tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;border:1px solid #ddd;">Product</th><th style="padding:8px;text-align:center;border:1px solid #ddd;">Qty</th><th style="padding:8px;text-align:right;border:1px solid #ddd;">Price</th></tr>';
        foreach ($items as $item) {
            $lineTotal = $item['product_price'] * $item['quantity'];
            $html .= '<tr>';
            $html .= '<td style="padding:8px;border:1px solid #ddd;">' . htmlspecialchars($item['product_name']) . '</td>';
            $html .= '<td style="padding:8px;text-align:center;border:1px solid #ddd;">' . $item['quantity'] . '</td>';
            $html .= '<td style="padding:8px;text-align:right;border:1px solid #ddd;">৳' . number_format($lineTotal, 0) . '</td>';
            $html .= '</tr>';
        }
        $html .= '</table>';
        return $html;
    }

    private static function formatAddress(array $addr): string
    {
        return implode(', ', array_filter([$addr['address_line'] ?? '', $addr['thana'] ?? '', $addr['district'] ?? '', $addr['division'] ?? '']));
    }

    private static function getPaymentLabel(string $method): string
    {
        return match ($method) {
            'cod'           => 'Cash on Delivery',
            'bkash'         => 'bKash',
            'nagad'         => 'Nagad',
            'bank_transfer' => 'Bank Transfer',
            'sslcommerz'    => 'SSLCommerz',
            'aamarpay'      => 'AamarPay',
            'surjopay'      => 'SurjoPay',
            default         => $method,
        };
    }
}
```

---

## SMS System

### `src/SMSService.php` — Multi-Provider SMS Gateway

```php
<?php
declare(strict_types=1);

class SMSService
{
    private string $provider;
    private string $apiKey;
    private string $apiSecret;
    private string $senderId;
    private array $config;

    public function __construct()
    {
        $this->provider  = getenv('SMS_PROVIDER') ?: 'twilio';
        $this->apiKey    = getenv('SMS_API_KEY') ?: '';
        $this->apiSecret = getenv('SMS_API_SECRET') ?: '';
        $this->senderId  = getenv('SMS_SENDER_ID') ?: 'Artistiya';
        $this->config    = [];
    }

    /**
     * Send SMS via configured provider
     * Dynamic API key — admin panel settings override .env defaults
     */
    public function send(string $to, string $message): bool
    {
        try {
            // Load settings from DB (admin panel)
            $settings = Database::fetchOne("SELECT * FROM sms_settings LIMIT 1");
            if ($settings && !$settings['is_enabled']) return false;

            if ($settings) {
                $this->provider  = $settings['provider'] ?? $this->provider;
                $this->apiKey    = $settings['api_key'] ? Encryption::decrypt($settings['api_key']) : $this->apiKey;
                $this->apiSecret = $settings['api_secret'] ? Encryption::decrypt($settings['api_secret']) : $this->apiSecret;
                $this->senderId  = $settings['sender_id'] ?? $this->senderId;
                $this->config    = json_decode($settings['config'] ?? '{}', true);
            }

            $cleanPhone = $this->formatPhone($to);

            $result = match ($this->provider) {
                'twilio'    => $this->sendViaTwilio($cleanPhone, $message),
                'bulksmsbd' => $this->sendViaBulkSMSBD($cleanPhone, $message),
                'smsq'      => $this->sendViaSMSQ($cleanPhone, $message),
                'greenweb'  => $this->sendViaGreenWeb($cleanPhone, $message),
                'infobip'   => $this->sendViaInfobip($cleanPhone, $message),
                'nexmo'     => $this->sendViaNexmo($cleanPhone, $message),
                'custom'    => $this->sendViaCustomAPI($cleanPhone, $message),
                default     => throw new \RuntimeException("Unknown SMS provider: {$this->provider}"),
            };

            $this->logSMS($to, $message, 'sent');
            return $result;
        } catch (\Throwable $e) {
            error_log("SMS error: " . $e->getMessage());
            $this->logSMS($to, $message, 'failed', $e->getMessage());
            return false;
        }
    }

    // ── Provider Implementations ──

    private function sendViaTwilio(string $to, string $message): bool
    {
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->apiKey}/Messages.json";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => "{$this->apiKey}:{$this->apiSecret}",
            CURLOPT_POSTFIELDS => http_build_query([
                'From' => $this->senderId,
                'To'   => $to,
                'Body' => $message,
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode >= 400) throw new \RuntimeException('Twilio error: ' . ($response['message'] ?? 'Unknown'));
        return true;
    }

    private function sendViaBulkSMSBD(string $to, string $message): bool
    {
        $url = "http://bulksmsbd.net/api/smsapi";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'api_key'   => $this->apiKey,
                'senderid'  => $this->senderId,
                'number'    => $to,
                'message'   => $message,
                'type'      => 'text',
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return ($response['response_code'] ?? 0) == 202;
    }

    private function sendViaSMSQ(string $to, string $message): bool
    {
        $url = "https://api.smsq.global/api/v2/SendSMS";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'SenderId' => $this->senderId,
                'ApiKey'   => $this->apiKey,
                'ClientId' => $this->apiSecret,
                'Message'  => $message,
                'MobileNumbers' => $to,
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return !empty($response['Data']);
    }

    private function sendViaGreenWeb(string $to, string $message): bool
    {
        $url = "http://api.greenweb.com.bd/api.php";
        $params = http_build_query([
            'token' => $this->apiKey,
            'to'    => $to,
            'message' => $message,
        ]);
        $response = file_get_contents($url . '?' . $params);
        return strpos($response, 'Ok') !== false;
    }

    private function sendViaInfobip(string $to, string $message): bool
    {
        $baseUrl = $this->config['infobip_base_url'] ?? 'https://api.infobip.com';
        $ch = curl_init("$baseUrl/sms/2/text/advanced");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: App {$this->apiKey}",
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'messages' => [[
                    'from' => $this->senderId,
                    'destinations' => [['to' => $to]],
                    'text' => $message,
                ]],
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return !empty($response['messages']);
    }

    private function sendViaNexmo(string $to, string $message): bool
    {
        $ch = curl_init("https://rest.nexmo.com/sms/json");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'api_key'    => $this->apiKey,
                'api_secret' => $this->apiSecret,
                'from'       => $this->senderId,
                'to'         => $to,
                'text'       => $message,
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return ($response['messages'][0]['status'] ?? '') === '0';
    }

    private function sendViaCustomAPI(string $to, string $message): bool
    {
        $url = $this->config['custom_url'] ?? '';
        if (!$url) throw new \RuntimeException('Custom SMS API URL not configured');

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "X-Api-Key: {$this->apiKey}",
                "X-Api-Secret: {$this->apiSecret}",
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'to'      => $to,
                'message' => $message,
                'from'    => $this->senderId,
            ]),
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $httpCode >= 200 && $httpCode < 300;
    }

    // ── Helpers ──

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);
        if (preg_match('/^01[3-9]\d{8}$/', $phone)) {
            return '+88' . $phone; // Bangladesh number
        }
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }
        return $phone;
    }

    private function logSMS(string $to, string $message, string $status, ?string $error = null): void
    {
        try {
            Database::insert('sms_log', [
                'recipient'    => $to,
                'message'      => mb_substr($message, 0, 500),
                'provider'     => $this->provider,
                'status'       => $status,
                'message_type' => 'notification',
                'error'        => $error,
                'sent_at'      => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            error_log("SMS log error: " . $e->getMessage());
        }
    }
}
```

### `src/OTPService.php` — OTP Generation & Verification

```php
<?php
declare(strict_types=1);

class OTPService
{
    private const OTP_LENGTH = 6;
    private const OTP_EXPIRY_MINUTES = 5;
    private const MAX_ATTEMPTS = 5;

    /**
     * Generate and send OTP to phone number
     */
    public static function sendOTP(string $phone, string $purpose = 'login'): array
    {
        $settings = Database::fetchOne("SELECT * FROM sms_settings LIMIT 1");
        if (!$settings || !$settings['send_otp']) {
            throw new \RuntimeException('OTP service is disabled');
        }

        // Rate limiting
        RateLimit::check($phone, 'otp', 5, 300); // 5 OTP per 5 minutes

        // Generate OTP
        $otp = str_pad((string)random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);
        $expiresAt = date('Y-m-d H:i:s', time() + (self::OTP_EXPIRY_MINUTES * 60));

        // Store OTP (hashed)
        $otpHash = password_hash($otp, PASSWORD_BCRYPT);

        // Invalidate previous OTPs for this phone
        Database::query(
            "UPDATE otp_codes SET is_used = 1 WHERE phone = ? AND purpose = ? AND is_used = 0",
            [$phone, $purpose]
        );

        Database::insert('otp_codes', [
            'phone'      => $phone,
            'otp_hash'   => $otpHash,
            'purpose'    => $purpose,
            'expires_at' => $expiresAt,
            'attempts'   => 0,
            'is_used'    => 0,
        ]);

        // Send SMS
        $sms = new SMSService();
        $message = "Your Artistiya verification code is: $otp. Valid for " . self::OTP_EXPIRY_MINUTES . " minutes. Do not share this code.";
        $sms->send($phone, $message);

        RateLimit::increment($phone, 'otp');

        return ['success' => true, 'expires_in' => self::OTP_EXPIRY_MINUTES * 60];
    }

    /**
     * Verify OTP
     */
    public static function verifyOTP(string $phone, string $otp, string $purpose = 'login'): bool
    {
        $record = Database::fetchOne(
            "SELECT * FROM otp_codes WHERE phone = ? AND purpose = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1",
            [$phone, $purpose]
        );

        if (!$record) throw new \RuntimeException('No OTP found for this number');
        if (strtotime($record['expires_at']) < time()) throw new \RuntimeException('OTP has expired');
        if ($record['attempts'] >= self::MAX_ATTEMPTS) throw new \RuntimeException('Maximum verification attempts exceeded');

        // Increment attempts
        Database::query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", [$record['id']]);

        if (!password_verify($otp, $record['otp_hash'])) {
            return false;
        }

        // Mark as used
        Database::update('otp_codes', ['is_used' => 1, 'verified_at' => date('Y-m-d H:i:s')], $record['id']);
        return true;
    }
}
```

### `src/OrderSMSService.php` — Order SMS Automation

```php
<?php
declare(strict_types=1);

class OrderSMSService
{
    public static function sendOrderConfirmation(string $orderId): bool
    {
        $settings = Database::fetchOne("SELECT * FROM sms_settings LIMIT 1");
        if (!$settings || !$settings['is_enabled'] || !$settings['send_order_confirmation']) return false;

        $order = self::getOrderData($orderId);
        if (!$order || !$order['phone']) return false;

        $message = "Thank you for your order #{$order['order_number']}! "
                 . "Total: BDT {$order['total']}. "
                 . "Track: " . getenv('APP_URL') . "/track-order?order={$order['order_number']}";

        return (new SMSService())->send($order['phone'], $message);
    }

    public static function sendShippingUpdate(string $orderId, string $trackingNumber = ''): bool
    {
        $settings = Database::fetchOne("SELECT * FROM sms_settings LIMIT 1");
        if (!$settings || !$settings['is_enabled'] || !$settings['send_shipping_update']) return false;

        $order = self::getOrderData($orderId);
        if (!$order || !$order['phone']) return false;

        $message = "Your order #{$order['order_number']} has been shipped! "
                 . ($trackingNumber ? "Tracking: $trackingNumber. " : '')
                 . "Track: " . getenv('APP_URL') . "/track-order?order={$order['order_number']}";

        return (new SMSService())->send($order['phone'], $message);
    }

    public static function sendDeliveryConfirmation(string $orderId): bool
    {
        $settings = Database::fetchOne("SELECT * FROM sms_settings LIMIT 1");
        if (!$settings || !$settings['is_enabled'] || !$settings['send_delivery_notification']) return false;

        $order = self::getOrderData($orderId);
        if (!$order || !$order['phone']) return false;

        $message = "Your order #{$order['order_number']} has been delivered! "
                 . "Thank you for shopping with Artistiya.";

        return (new SMSService())->send($order['phone'], $message);
    }

    private static function getOrderData(string $orderId): ?array
    {
        $order = Database::fetchOne(
            "SELECT o.order_number, o.total, a.phone
             FROM orders o LEFT JOIN addresses a ON o.address_id = a.id WHERE o.id = ?",
            [$orderId]
        );
        return $order ?: null;
    }
}
```

### `api/sms.php` — SMS API Endpoint

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../vendor/autoload.php';
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit(json_encode(['error' => 'Method not allowed']));
    }

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $userId = Auth::validateToken(str_replace('Bearer ', '', $authHeader));
    if (!$userId || !Auth::isAdmin($userId)) {
        http_response_code(401);
        exit(json_encode(['error' => 'Unauthorized']));
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? '';

    $result = match ($action) {
        'send_order_sms' => OrderSMSService::sendOrderConfirmation($body['order_id'] ?? ''),
        'send_shipping_sms' => OrderSMSService::sendShippingUpdate($body['order_id'] ?? '', $body['tracking_number'] ?? ''),
        'send_delivery_sms' => OrderSMSService::sendDeliveryConfirmation($body['order_id'] ?? ''),
        'send_test' => (new SMSService())->send($body['phone'] ?? '', $body['message'] ?? 'Test SMS from Artistiya'),
        default => throw new \InvalidArgumentException('Invalid action'),
    };

    echo json_encode(['success' => $result]);
} catch (\Throwable $e) {
    error_log("SMS API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process SMS request']);
}
```

### `api/otp.php` — OTP API Endpoint

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../vendor/autoload.php';
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit(json_encode(['error' => 'Method not allowed']));
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $action = $body['action'] ?? '';

    match ($action) {
        'send' => function() use ($body) {
            $phone = Sanitizer::cleanPhone($body['phone'] ?? '');
            if (!Sanitizer::isValidPhone($phone)) {
                http_response_code(400);
                exit(json_encode(['error' => 'Invalid phone number']));
            }
            $result = OTPService::sendOTP($phone, $body['purpose'] ?? 'login');
            echo json_encode($result);
        },
        'verify' => function() use ($body) {
            $phone = Sanitizer::cleanPhone($body['phone'] ?? '');
            $otp = $body['otp'] ?? '';
            $verified = OTPService::verifyOTP($phone, $otp, $body['purpose'] ?? 'login');
            echo json_encode(['success' => $verified]);
        },
        default => throw new \InvalidArgumentException('Invalid action'),
    };
} catch (\Throwable $e) {
    error_log("OTP API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
```

### MySQL Tables for SMS & OTP

Add these to `DATABASE_SCHEMA_MYSQL.sql`:

```sql
-- SMS Settings
CREATE TABLE IF NOT EXISTS sms_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    is_enabled TINYINT(1) DEFAULT 0,
    provider VARCHAR(50) DEFAULT 'twilio',
    api_key TEXT NULL,
    api_secret TEXT NULL,
    sender_id VARCHAR(50) NULL,
    config JSON DEFAULT '{}',
    send_order_confirmation TINYINT(1) DEFAULT 1,
    send_shipping_update TINYINT(1) DEFAULT 1,
    send_delivery_notification TINYINT(1) DEFAULT 1,
    send_otp TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS Log
CREATE TABLE IF NOT EXISTS sms_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'twilio',
    status VARCHAR(20) DEFAULT 'sent',
    message_type VARCHAR(50) DEFAULT 'notification',
    error TEXT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sms_recipient (recipient),
    INDEX idx_sms_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTP Codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    attempts TINYINT DEFAULT 0,
    is_used TINYINT(1) DEFAULT 0,
    verified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_phone (phone, purpose, is_used),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Email & SMS Integration in Order Flow

### In `api/orders.php` — After Order Creation

```php
// Automatic email confirmation
OrderEmailService::sendOrderConfirmation($orderId);

// Automatic SMS confirmation
OrderSMSService::sendOrderConfirmation($orderId);
```

### On Status Update (admin actions)

```php
if ($newStatus === 'shipped') {
    OrderEmailService::sendShippingUpdate($orderId, $trackingNumber, $courierName);
    OrderSMSService::sendShippingUpdate($orderId, $trackingNumber);
}
if ($newStatus === 'delivered') {
    OrderEmailService::sendDeliveryConfirmation($orderId);
    OrderSMSService::sendDeliveryConfirmation($orderId);
}
```

---

## File Upload

### Image Upload Handler

```php
<?php
class ImageUpload
{
    private static array $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private static int $maxSize = 5 * 1024 * 1024; // 5MB

    public static function upload(array $file, string $folder = 'products'): string
    {
        if ($file['error'] !== UPLOAD_ERR_OK) throw new \RuntimeException('Upload failed');
        if ($file['size'] > self::$maxSize) throw new \RuntimeException('File too large (max 5MB)');

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::$allowedTypes)) throw new \RuntimeException('Invalid file type');

        $ext = match ($mimeType) {
            'image/jpeg' => 'jpg', 'image/png' => 'png',
            'image/webp' => 'webp', 'image/gif' => 'gif',
        };
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $uploadDir = __DIR__ . "/../storage/uploads/$folder/";
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $path = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) throw new \RuntimeException('Failed to save file');
        return "/storage/uploads/$folder/$filename";
    }
}
```

---

## `.htaccess` (Apache Security)

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

<FilesMatch "^\.env|composer\.(json|lock)$">
    Order allow,deny
    Deny from all
</FilesMatch>

Options -Indexes

php_value upload_max_filesize 10M
php_value post_max_size 12M
php_value max_execution_time 30
```

---

## Cron Jobs (Hostinger hPanel)

```
# Email queue processor (every minute)
Command:  php /home/u123456/public_html/cron/process-email-queue.php
Schedule: */1 * * * *

# Clean expired OTP codes (every hour)
Command:  php -r "require '/home/u123456/public_html/vendor/autoload.php'; Database::query('DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL 24 HOUR');"
Schedule: 0 * * * *
```

---

## Composer Setup

```json
{
    "name": "artistiya/store-backend",
    "description": "Artistiya E-Commerce PHP Backend",
    "require": {
        "php": ">=8.1",
        "phpmailer/phpmailer": "^6.9",
        "vlucas/phpdotenv": "^5.6"
    },
    "autoload": {
        "classmap": ["src/"]
    }
}
```

Install via SSH:
```bash
cd /home/u123456/public_html
composer2 install --no-dev --optimize-autoloader
```

---

## Migration Checklist

- [ ] Install MySQL 8.0+ and configure
- [ ] Run `DATABASE_SCHEMA_MYSQL.sql` (includes email_queue, email_log, sms_settings, sms_log, otp_codes tables)
- [ ] Export all table data from Supabase as CSV
- [ ] Import data into MySQL
- [ ] Configure `.env` file (Hostinger SMTP + SMS settings)
- [ ] Setup SSL certificate
- [ ] Encrypt payment gateway credentials and save to DB
- [ ] **Hostinger Email Setup:**
  - [ ] hPanel → Emails → Create email account (info@artistiya.store)
  - [ ] SSH: `composer2 require phpmailer/phpmailer`
  - [ ] Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in `.env`
  - [ ] Call `EmailService::testConnection()` to verify SMTP connection
  - [ ] hPanel → Cron Jobs → Set `process-email-queue.php` to run every minute
  - [ ] Send test email to confirm inbox delivery
- [ ] **SMS Setup:**
  - [ ] Choose SMS provider (Twilio, BulkSMSBD, etc.)
  - [ ] Add API credentials in admin panel → SMS Settings
  - [ ] Test SMS delivery
- [ ] Create file upload directory and set permissions (755)
- [ ] Add `.htaccess` security rules
- [ ] Test rate limiting
- [ ] Test payment sandbox
- [ ] Test delivery API
- [ ] Test all CRUD operations
- [ ] Production deploy and final security audit
