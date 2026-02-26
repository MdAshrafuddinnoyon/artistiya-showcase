# Artistiya E-Commerce: PHP/MySQL মাইগ্রেশন গাইড

## সূচিপত্র
1. [প্রয়োজনীয়তা](#প্রয়োজনীয়তা)
2. [হোস্টিং সেটআপ](#হোস্টিং-সেটআপ)
3. [ডাটাবেজ মাইগ্রেশন](#ডাটাবেজ-মাইগ্রেশন)
4. [PHP কনফিগারেশন](#php-কনফিগারেশন)
5. [Authentication সিস্টেম](#authentication-সিস্টেম)
6. [API Endpoints](#api-endpoints)
7. [পেমেন্ট গেটওয়ে](#পেমেন্ট-গেটওয়ে)
8. [ডেলিভারি API](#ডেলিভারি-api)
9. [ইমেইল সিস্টেম (Hostinger SMTP)](#ইমেইল-সিস্টেম-hostinger-smtp)
10. [সিকিউরিটি](#সিকিউরিটি)
11. [ফাইল আপলোড](#ফাইল-আপলোড)

---

## প্রয়োজনীয়তা

| Component | Minimum Version |
|-----------|----------------|
| PHP | 8.1+ |
| MySQL | 8.0+ |
| Composer | 2.x |
| Apache/Nginx | Latest stable |
| SSL Certificate | Required (Let's Encrypt) |
| PHP Extensions | pdo_mysql, openssl, mbstring, json, curl, gd/imagick, fileinfo |

---

## হোস্টিং সেটআপ (Hostinger/cPanel)

### ১. ডাটাবেজ তৈরি

```
1. cPanel > MySQL Databases > Create New Database
2. Database name: artistiya_store
3. Create user: artistiya_user
4. Add user to database with ALL PRIVILEGES
```

### ২. PHP Version সেট করুন

```
cPanel > PHP Version > PHP 8.1+ select করুন
Extensions enable: pdo_mysql, openssl, mbstring, curl, gd
```

### ৩. SSL Certificate

```
cPanel > SSL/TLS > Let's Encrypt > Install
সকল HTTP request HTTPS-এ redirect করুন
```

---

## ডাটাবেজ মাইগ্রেশন

### ধাপ ১: MySQL Schema Import

```bash
mysql -u artistiya_user -p artistiya_store < docs/migration/DATABASE_SCHEMA_MYSQL.sql
```

### ধাপ ২: Supabase থেকে ডেটা Export

Supabase Dashboard > SQL Editor:
```sql
-- প্রতিটি টেবিলের জন্য CSV export
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM categories) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM orders) TO STDOUT WITH CSV HEADER;
-- ... সকল টেবিলের জন্য একই
```

### ধাপ ৩: MySQL-এ ডেটা Import

```bash
# CSV ফাইল import
LOAD DATA INFILE '/path/to/products.csv'
INTO TABLE products
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

### ধাপ ৪: UUID Migration

Supabase UUIDs → MySQL UUIDs: কোনো পরিবর্তন দরকার নেই কারণ MySQL 8.0+ UUID() সাপোর্ট করে।

---

## PHP কনফিগারেশন

### ফাইল স্ট্রাকচার

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
│   ├── OrderService.php      # Order processing
│   ├── PaymentService.php    # Payment handling
│   └── DeliveryService.php   # Delivery API
├── api/
│   ├── orders.php            # Order API
│   ├── products.php          # Product API
│   ├── auth.php              # Auth API
│   ├── payment-callback.php  # Payment IPN/callback
│   └── delivery-webhook.php  # Delivery webhooks
├── public/
│   ├── index.php             # Entry point
│   ├── .htaccess             # Apache rules
│   └── assets/               # Static files
├── storage/
│   ├── uploads/              # User uploads
│   └── logs/                 # Application logs
├── vendor/                   # Composer packages
└── .env                      # Environment variables
```

### `.env` ফাইল

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

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@artistiya.store
SMTP_PASS=your_app_password
SMTP_FROM_NAME=Artistiya

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

### `src/Database.php` - PDO Wrapper (Injection-Proof)

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

    /**
     * Prepared statement execution - SQL Injection proof
     */
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

## Authentication সিস্টেম

### `src/Auth.php`

```php
<?php
declare(strict_types=1);

class Auth
{
    /**
     * Register user with password hashing
     */
    public static function register(string $email, string $password, string $fullName): array
    {
        // Validate
        $email = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
        if (!$email) throw new \InvalidArgumentException('Invalid email');
        
        if (strlen($password) < 8) {
            throw new \InvalidArgumentException('Password must be at least 8 characters');
        }
        
        // Check existing
        $existing = Database::fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
        if ($existing) throw new \RuntimeException('Email already registered');
        
        // Create user
        $userId = Database::insert('users', [
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_ARGON2ID, [
                'memory_cost' => 65536,
                'time_cost' => 4,
                'threads' => 3,
            ]),
        ]);
        
        // Create profile
        Database::insert('profiles', [
            'user_id' => $userId,
            'full_name' => Sanitizer::cleanString($fullName, 100),
            'email' => $email,
        ]);
        
        // Assign customer role
        Database::insert('user_roles', [
            'user_id' => $userId,
            'role' => 'customer',
        ]);
        
        return ['user_id' => $userId, 'email' => $email];
    }

    /**
     * Login with rate limiting
     */
    public static function login(string $email, string $password, string $ip): array
    {
        // Rate limit check
        RateLimit::check($ip, 'login', 5, 900); // 5 attempts per 15 min
        
        $user = Database::fetchOne(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            [$email]
        );
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            RateLimit::increment($ip, 'login');
            throw new \RuntimeException('Invalid credentials');
        }
        
        // Generate JWT token
        $token = self::generateToken($user['id']);
        RateLimit::reset($ip, 'login');
        
        return ['token' => $token, 'user_id' => $user['id']];
    }

    public static function isAdmin(string $userId): bool
    {
        $role = Database::fetchOne(
            "SELECT id FROM user_roles WHERE user_id = ? AND role = 'admin'",
            [$userId]
        );
        return $role !== null;
    }

    private static function generateToken(string $userId): string
    {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + 86400, // 24 hours
        ]));
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

## সিকিউরিটি

### `src/Sanitizer.php` - ইনপুট স্যানিটাইজেশন

```php
<?php
declare(strict_types=1);

class Sanitizer
{
    /**
     * XSS-safe string cleaning
     */
    public static function cleanString(string $input, int $maxLen = 500): string
    {
        $clean = strip_tags($input);
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return mb_substr(trim($clean), 0, $maxLen);
    }

    /**
     * Bangladesh phone validation
     */
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

    /**
     * Sanitize for SQL LIKE queries (prevent wildcard injection)
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $value);
    }
}
```

### `src/CSRF.php` - CSRF Protection

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
        
        // Token expires after 1 hour
        if ((time() - ($_SESSION['csrf_time'] ?? 0)) > 3600) return false;
        
        // One-time use
        unset($_SESSION['csrf_token'], $_SESSION['csrf_time']);
        return true;
    }

    public static function htmlInput(): string
    {
        $token = self::generateToken();
        return '<input type="hidden" name="_csrf_token" value="' . $token . '">';
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
        Database::query(
            "DELETE FROM rate_limits WHERE identifier = ? AND action = ?",
            [$identifier, $action]
        );
    }
}
```

### `src/Encryption.php` - AES-256 Encryption

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
        $iv = random_bytes(12); // GCM uses 12-byte IV
        $tag = '';
        
        $ciphertext = openssl_encrypt(
            $plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag
        );
        
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
        
        $plaintext = openssl_decrypt(
            $ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag
        );
        
        if ($plaintext === false) throw new \RuntimeException('Decryption failed');
        return $plaintext;
    }
}
```

---

## API Endpoints

### `api/orders.php` - সিকিউর অর্ডার প্রসেসিং

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

try {
    // Only POST allowed
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

    // ── Validation ──
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

    // ── Blocked customer check ──
    $blocked = Database::fetchOne(
        "SELECT id FROM blocked_customers WHERE phone = ? AND is_active = 1",
        [$cleanPhone]
    );
    if ($blocked) {
        http_response_code(403);
        exit(json_encode(['error' => 'Order cannot be processed. Contact support.']));
    }

    // ── Rate limiting by phone ──
    RateLimit::check($cleanPhone, 'order', 5, 86400); // 5 orders per 24h

    // ── Server-side price verification ──
    $productIds = array_unique(array_column($items, 'product_id'));
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $products = Database::fetchAll(
        "SELECT id, name, price, stock_quantity, is_preorderable, is_active 
         FROM products WHERE id IN ($placeholders)",
        $productIds
    );
    $productMap = array_column($products, null, 'id');

    $serverSubtotal = 0;
    $verifiedItems = [];
    foreach ($items as $item) {
        $product = $productMap[$item['product_id']] ?? null;
        if (!$product || !$product['is_active']) {
            http_response_code(400);
            exit(json_encode(['error' => "Product not found or inactive"]));
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

    // ── Shipping cost (server-side) ──
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

    // ── Promo code (server-side) ──
    $promoDiscount = 0;
    $promoId = null;
    if ($promoCode) {
        $promo = Database::fetchOne(
            "SELECT * FROM promo_codes WHERE code = ? AND is_active = 1",
            [strtoupper(trim($promoCode))]
        );
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

    // ── COD extra charge ──
    $codCharge = 0;
    if ($paymentMethod === 'cod') {
        $cs = Database::fetchOne("SELECT cod_extra_charge FROM checkout_settings LIMIT 1");
        $codCharge = $cs['cod_extra_charge'] ?? 0;
    }

    $serverTotal = max(0, $serverSubtotal + $shippingCost + $codCharge - $promoDiscount);

    // ── Create address ──
    $addressId = Database::insert('addresses', [
        'user_id' => $body['user_id'] ?? '00000000-0000-0000-0000-000000000001',
        'full_name' => Sanitizer::cleanString($address['full_name'], 100),
        'phone' => $cleanPhone,
        'division' => Sanitizer::cleanString($address['division'] ?? 'N/A', 50),
        'district' => Sanitizer::cleanString($address['district'] ?? 'N/A', 50),
        'thana' => Sanitizer::cleanString($address['thana'] ?? 'N/A', 50),
        'address_line' => Sanitizer::cleanString($address['address_line'] ?? 'N/A', 300),
    ]);

    // ── Create order ──
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

    // ── Create order items ──
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

    // ── Update promo usage ──
    if ($promoId) {
        Database::query(
            "UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?",
            [$promoId]
        );
    }

    RateLimit::increment($cleanPhone, 'order');

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

## পেমেন্ট গেটওয়ে ইন্টিগ্রেশন

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

        if ($response['status'] !== 'SUCCESS') {
            throw new \RuntimeException('Payment initiation failed');
        }

        return [
            'gateway_url' => $response['GatewayPageURL'],
            'session_key' => $response['sessionkey'],
        ];
    }

    public function validatePayment(string $valId): array
    {
        $url = $this->baseUrl . '/validator/api/validationserverAPI.php';
        $url .= '?val_id=' . urlencode($valId);
        $url .= '&store_id=' . urlencode($this->storeId);
        $url .= '&store_passwd=' . urlencode($this->storePass);

        $response = json_decode(file_get_contents($url), true);
        return $response;
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
        $provider = Database::fetchOne(
            "SELECT * FROM payment_providers WHERE provider_type = 'bkash' AND is_active = 1"
        );
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
            'app_key'    => $this->appKey,
            'app_secret' => $this->appSecret,
        ], [
            'username' => $this->username,
            'password' => $this->password,
        ]);
        return $response['id_token'];
    }

    public function createPayment(string $token, string $orderId, float $amount): array
    {
        return $this->apiCall('/tokenized/checkout/create', [
            'mode'                => '0011',
            'payerReference'      => $orderId,
            'callbackURL'         => getenv('APP_URL') . '/api/payment-callback.php?gateway=bkash',
            'amount'              => number_format($amount, 2, '.', ''),
            'currency'            => 'BDT',
            'intent'              => 'sale',
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
        foreach ($headers as $k => $v) {
            $curlHeaders[] = "$k: $v";
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => $curlHeaders,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return $response;
    }
}
```

### Payment Callback Handler

```php
<?php
// api/payment-callback.php
require_once __DIR__ . '/../vendor/autoload.php';

$gateway = $_GET['gateway'] ?? '';
$body = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {
    switch ($gateway) {
        case 'sslcommerz':
            $valId = $body['val_id'] ?? '';
            $tranId = $body['tran_id'] ?? '';
            $amount = floatval($body['amount'] ?? 0);
            
            $ssl = new SSLCommerzPayment();
            $validation = $ssl->validatePayment($valId);
            
            if ($validation['status'] === 'VALID' || $validation['status'] === 'VALIDATED') {
                // Verify amount matches order
                $order = Database::fetchOne("SELECT total FROM orders WHERE id = ?", [$tranId]);
                if ($order && abs($order['total'] - $amount) <= 1) {
                    Database::update('orders', ['status' => 'confirmed', 'payment_transaction_id' => $valId], $tranId);
                }
            }
            break;

        case 'bkash':
            $paymentId = $body['paymentID'] ?? '';
            $bkash = new BkashPayment();
            $token = $bkash->grantToken();
            // Execute and verify payment...
            break;

        case 'nagad':
            // Nagad callback handling...
            break;
    }
    
    echo json_encode(['status' => 'ok']);
} catch (\Throwable $e) {
    error_log("Payment callback error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Payment verification failed']);
}
```

---

## ডেলিভারি API ইন্টিগ্রেশন

### Steadfast Courier (PHP)

```php
<?php
class SteadfastDelivery
{
    private string $apiKey;
    private string $secretKey;
    private string $baseUrl = 'https://portal.steadfast.com.bd/api/v1';

    public function __construct()
    {
        $provider = Database::fetchOne(
            "SELECT * FROM delivery_providers WHERE provider_type = 'steadfast' AND is_active = 1"
        );
        $this->apiKey = Encryption::decrypt($provider['api_key']);
        $this->secretKey = Encryption::decrypt($provider['api_secret']);
    }

    public function createOrder(array $data): array
    {
        return $this->request('/create_order', 'POST', [
            'invoice'        => Sanitizer::cleanString($data['invoice'], 50),
            'recipient_name' => Sanitizer::cleanString($data['recipient_name'], 100),
            'recipient_phone'=> Sanitizer::cleanPhone($data['phone']),
            'recipient_address' => Sanitizer::cleanString($data['address'], 300),
            'cod_amount'     => max(0, min(100000, floatval($data['cod_amount']))),
            'note'           => Sanitizer::cleanString($data['note'] ?? '', 200),
        ]);
    }

    public function trackOrder(string $consignmentId): array
    {
        return $this->request("/status_by_cid/$consignmentId", 'GET');
    }

    private function request(string $endpoint, string $method, array $data = []): array
    {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Api-Key: {$this->apiKey}",
                "Secret-Key: {$this->secretKey}",
            ],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        return $response;
    }
}
```

---

## ইমেইল সিস্টেম (Hostinger SMTP)

Hostinger হোস্টিংয়ে বিল্ট-ইন SMTP সার্ভিস থাকে। এটি দিয়ে অর্ডার কনফার্মেশন, শিপিং আপডেট, ডেলিভারি নোটিফিকেশন, পাসওয়ার্ড রিসেট এবং নিউজলেটার ইমেইল পাঠানো যায়।

### `.env` ইমেইল কনফিগারেশন (Hostinger)

```env
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_ENCRYPTION=ssl
SMTP_USER=info@artistiya.store
SMTP_PASS=your_email_password
SMTP_FROM_EMAIL=info@artistiya.store
SMTP_FROM_NAME=Artistiya
SMTP_REPLY_TO=support@artistiya.store

# Alternative: Port 587 with TLS
# SMTP_HOST=smtp.hostinger.com
# SMTP_PORT=587
# SMTP_ENCRYPTION=tls
```

### ফাইল স্ট্রাকচার

```
artistiya/
├── src/
│   ├── EmailService.php         # মূল ইমেইল ক্লাস (SMTP)
│   ├── EmailTemplateEngine.php  # টেম্পলেট রেন্ডারিং
│   └── EmailQueue.php           # ইমেইল কিউ (ব্যাকগ্রাউন্ড সেন্ড)
├── templates/
│   └── emails/
│       ├── order-confirmation.html
│       ├── order-shipped.html
│       ├── order-delivered.html
│       ├── password-reset.html
│       ├── welcome.html
│       └── newsletter.html
├── api/
│   └── email.php                # ইমেইল API endpoint
└── cron/
    └── process-email-queue.php  # Cron job (কিউ প্রসেসিং)
```

### `src/EmailService.php` — সম্পূর্ণ SMTP ইমেইল সার্ভিস

```php
<?php
declare(strict_types=1);

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
    private $socket;
    private array $log = [];

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
     * ইমেইল পাঠানো — মূল ফাংশন
     */
    public function send(string $to, string $subject, string $htmlBody, array $options = []): bool
    {
        try {
            // DB থেকে email_settings চেক
            $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
            if ($settings && !$settings['is_enabled']) {
                $this->log[] = 'Email sending is disabled in settings';
                return false;
            }

            // Settings override (DB > .env)
            if ($settings) {
                if ($settings['smtp_host']) $this->host = $settings['smtp_host'];
                if ($settings['smtp_port']) $this->port = (int)$settings['smtp_port'];
                if ($settings['smtp_user']) $this->username = Encryption::decrypt($settings['smtp_user']);
                if ($settings['smtp_password']) $this->password = Encryption::decrypt($settings['smtp_password']);
                if ($settings['from_email']) $this->fromEmail = $settings['from_email'];
                if ($settings['from_name']) $this->fromName = $settings['from_name'];
                if ($settings['reply_to_email']) $this->replyTo = $settings['reply_to_email'];
            }

            // Resend API ব্যবহার করলে
            if (($settings['provider'] ?? 'smtp') === 'resend') {
                return $this->sendViaResend($to, $subject, $htmlBody, $settings['resend_api_key'] ?? '');
            }

            // SMTP দিয়ে পাঠানো
            return $this->sendViaSMTP($to, $subject, $htmlBody, $options);

        } catch (\Throwable $e) {
            error_log("Email error: " . $e->getMessage());
            $this->log[] = $e->getMessage();
            return false;
        }
    }

    /**
     * Hostinger SMTP দিয়ে ইমেইল পাঠানো
     */
    private function sendViaSMTP(string $to, string $subject, string $htmlBody, array $options = []): bool
    {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ]
        ]);

        $protocol = ($this->encryption === 'ssl') ? 'ssl://' : 'tcp://';
        $this->socket = stream_socket_client(
            $protocol . $this->host . ':' . $this->port,
            $errno, $errstr, 30,
            STREAM_CLIENT_CONNECT, $context
        );

        if (!$this->socket) {
            throw new \RuntimeException("SMTP connection failed: $errstr ($errno)");
        }

        $this->readResponse(220);

        // EHLO
        $this->sendCommand("EHLO " . gethostname(), 250);

        // STARTTLS (port 587)
        if ($this->encryption === 'tls') {
            $this->sendCommand("STARTTLS", 220);
            stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
            $this->sendCommand("EHLO " . gethostname(), 250);
        }

        // AUTH LOGIN
        $this->sendCommand("AUTH LOGIN", 334);
        $this->sendCommand(base64_encode($this->username), 334);
        $this->sendCommand(base64_encode($this->password), 235);

        // MAIL FROM
        $this->sendCommand("MAIL FROM:<{$this->fromEmail}>", 250);

        // RCPT TO
        $recipients = is_array($to) ? $to : [$to];
        foreach ($recipients as $recipient) {
            $this->sendCommand("RCPT TO:<{$recipient}>", 250);
        }

        // CC
        if (!empty($options['cc'])) {
            foreach ((array)$options['cc'] as $cc) {
                $this->sendCommand("RCPT TO:<{$cc}>", 250);
            }
        }

        // BCC
        if (!empty($options['bcc'])) {
            foreach ((array)$options['bcc'] as $bcc) {
                $this->sendCommand("RCPT TO:<{$bcc}>", 250);
            }
        }

        // DATA
        $this->sendCommand("DATA", 354);

        // Build email headers
        $boundary = md5(uniqid((string)time()));
        $headers = $this->buildHeaders($to, $subject, $boundary, $options);
        $body = $this->buildBody($htmlBody, $boundary, $options['text_body'] ?? null);

        // Send email content
        fwrite($this->socket, $headers . "\r\n" . $body . "\r\n.\r\n");
        $this->readResponse(250);

        // QUIT
        $this->sendCommand("QUIT", 221);
        fclose($this->socket);

        // সফল হলে log রাখুন
        $this->logEmailSent($to, $subject, 'smtp');

        return true;
    }

    /**
     * Resend API দিয়ে পাঠানো (ফলব্যাক)
     */
    private function sendViaResend(string $to, string $subject, string $htmlBody, string $apiKey): bool
    {
        if (!$apiKey) {
            $apiKey = Encryption::decrypt($apiKey);
        }

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer $apiKey",
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'from' => "{$this->fromName} <{$this->fromEmail}>",
                'to' => [$to],
                'subject' => $subject,
                'html' => $htmlBody,
                'reply_to' => $this->replyTo,
            ]),
        ]);

        $response = json_decode(curl_exec($ch), true);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new \RuntimeException('Resend API error: ' . json_encode($response));
        }

        $this->logEmailSent($to, $subject, 'resend');
        return true;
    }

    private function buildHeaders(string $to, string $subject, string $boundary, array $options): string
    {
        $headers  = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Reply-To: {$this->replyTo}\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
        $headers .= "X-Mailer: Artistiya-PHP/1.0\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "Message-ID: <" . md5(uniqid((string)time())) . "@" . parse_url(getenv('APP_URL'), PHP_URL_HOST) . ">\r\n";

        if (!empty($options['cc'])) {
            $headers .= "Cc: " . implode(', ', (array)$options['cc']) . "\r\n";
        }

        return $headers;
    }

    private function buildBody(string $htmlBody, string $boundary, ?string $textBody = null): string
    {
        $plainText = $textBody ?: strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlBody));

        $body  = "--{$boundary}\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($plainText)) . "\r\n";

        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";

        $body .= "--{$boundary}--";
        return $body;
    }

    private function sendCommand(string $command, int $expectedCode): string
    {
        fwrite($this->socket, $command . "\r\n");
        return $this->readResponse($expectedCode);
    }

    private function readResponse(int $expectedCode): string
    {
        $response = '';
        while ($line = fgets($this->socket, 512)) {
            $response .= $line;
            if ($line[3] === ' ') break;
        }
        $code = (int)substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new \RuntimeException("SMTP error: expected $expectedCode, got $code — $response");
        }
        return $response;
    }

    private function logEmailSent(string $to, string $subject, string $provider): void
    {
        try {
            Database::insert('email_log', [
                'recipient' => $to,
                'subject' => $subject,
                'provider' => $provider,
                'status' => 'sent',
                'sent_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // email_log টেবিল না থাকলে শুধু error_log
            error_log("Email sent to $to: $subject via $provider");
        }
    }

    public function getLog(): array
    {
        return $this->log;
    }
}
```

### `src/EmailTemplateEngine.php` — ডায়নামিক টেম্পলেট রেন্ডারিং

```php
<?php
declare(strict_types=1);

class EmailTemplateEngine
{
    /**
     * DB থেকে বা ফাইল থেকে টেম্পলেট লোড ও রেন্ডার
     */
    public static function render(string $templateKey, array $variables = []): string
    {
        // প্রথমে DB email_templates থেকে দেখুন
        $template = Database::fetchOne(
            "SELECT html_content FROM email_templates WHERE template_key = ? AND is_active = 1",
            [$templateKey]
        );

        if ($template) {
            return self::replaceVariables($template['html_content'], $variables);
        }

        // ফাইল থেকে ফলব্যাক
        $filePath = __DIR__ . "/../templates/emails/{$templateKey}.html";
        if (file_exists($filePath)) {
            $html = file_get_contents($filePath);
            return self::replaceVariables($html, $variables);
        }

        throw new \RuntimeException("Email template not found: $templateKey");
    }

    /**
     * ভেরিয়েবল রিপ্লেস: {{variable_name}} → মান
     */
    private static function replaceVariables(string $html, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $html = str_replace('{{' . $key . '}}', htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'), $html);
        }
        // সাইট ব্র্যান্ডিং যোগ
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

    /**
     * সাবজেক্ট টেম্পলেট রেন্ডার
     */
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
            'order-confirmation' => 'অর্ডার কনফার্মেশন — #{{order_number}}',
            'order-shipped'      => 'আপনার অর্ডার শিপ করা হয়েছে — #{{order_number}}',
            'order-delivered'    => 'অর্ডার ডেলিভারি সম্পন্ন — #{{order_number}}',
            'password-reset'     => 'পাসওয়ার্ড রিসেট — Artistiya',
            'welcome'            => 'স্বাগতম — Artistiya',
            'newsletter'         => 'Artistiya নিউজলেটার',
            default              => 'Artistiya — বিজ্ঞপ্তি',
        };
    }
}
```

### `src/EmailQueue.php` — ব্যাকগ্রাউন্ড ইমেইল কিউ

```php
<?php
declare(strict_types=1);

class EmailQueue
{
    /**
     * কিউতে ইমেইল যোগ করুন (তাৎক্ষণিক সেন্ডের বদলে)
     */
    public static function enqueue(string $to, string $subject, string $htmlBody, int $priority = 5): string
    {
        return Database::insert('email_queue', [
            'recipient'  => $to,
            'subject'    => $subject,
            'html_body'  => $htmlBody,
            'priority'   => $priority,
            'status'     => 'pending',
            'attempts'   => 0,
            'max_attempts' => 3,
            'scheduled_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Cron Job: পেন্ডিং ইমেইল প্রসেস
     * crontab: * * * * * php /path/to/cron/process-email-queue.php
     */
    public static function processQueue(int $batchSize = 10): int
    {
        $emails = Database::fetchAll(
            "SELECT * FROM email_queue 
             WHERE status = 'pending' AND attempts < max_attempts AND scheduled_at <= NOW()
             ORDER BY priority ASC, created_at ASC 
             LIMIT ?",
            [$batchSize]
        );

        $sent = 0;
        $mailer = new EmailService();

        foreach ($emails as $email) {
            Database::update('email_queue', [
                'status' => 'processing',
                'attempts' => $email['attempts'] + 1,
            ], $email['id']);

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

            usleep(200000); // 200ms বিরতি (Hostinger rate limit)
        }

        return $sent;
    }
}
```

### `src/OrderEmailService.php` — অর্ডার-ভিত্তিক ইমেইল অটোমেশন

```php
<?php
declare(strict_types=1);

class OrderEmailService
{
    /**
     * অর্ডার কনফার্মেশন ইমেইল — অর্ডার তৈরির পরই কল হবে
     */
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
            'discount'       => number_format($order['discount_amount'] ?? 0, 0),
            'total'          => number_format($order['total'], 0),
            'payment_method' => self::getPaymentLabel($order['payment_method']),
            'address'        => self::formatAddress($order['address']),
            'track_url'      => getenv('APP_URL') . '/track-order?order=' . $order['order_number'],
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-confirmation', [
            'order_number' => $order['order_number'],
        ]);

        // কাস্টমারকে পাঠান
        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 1);
        }

        // অ্যাডমিনকে কপি পাঠান
        $adminEmail = $settings['from_email'] ?? getenv('SMTP_FROM_EMAIL');
        if ($adminEmail) {
            EmailQueue::enqueue($adminEmail, "[Admin] $subject", $html, 3);
        }

        return true;
    }

    /**
     * শিপিং আপডেট ইমেইল
     */
    public static function sendShippingUpdate(string $orderId, string $trackingNumber = '', string $courierName = ''): bool
    {
        $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
        if ($settings && !$settings['send_shipping_update']) return false;

        $order = self::getOrderData($orderId);
        if (!$order) return false;

        $html = EmailTemplateEngine::render('order-shipped', [
            'customer_name'  => $order['customer_name'],
            'order_number'   => $order['order_number'],
            'tracking_number' => $trackingNumber ?: 'N/A',
            'courier_name'   => $courierName ?: 'কুরিয়ার সার্ভিস',
            'items_html'     => self::buildItemsHtml($order['items']),
            'address'        => self::formatAddress($order['address']),
            'track_url'      => getenv('APP_URL') . '/track-order?order=' . $order['order_number'],
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-shipped', [
            'order_number' => $order['order_number'],
        ]);

        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 1);
        }

        return true;
    }

    /**
     * ডেলিভারি কনফার্মেশন ইমেইল
     */
    public static function sendDeliveryConfirmation(string $orderId): bool
    {
        $settings = Database::fetchOne("SELECT * FROM email_settings LIMIT 1");
        if ($settings && !$settings['send_delivery_notification']) return false;

        $order = self::getOrderData($orderId);
        if (!$order) return false;

        $html = EmailTemplateEngine::render('order-delivered', [
            'customer_name' => $order['customer_name'],
            'order_number'  => $order['order_number'],
            'total'         => number_format($order['total'], 0),
            'review_url'    => getenv('APP_URL') . '/dashboard?tab=orders',
        ]);

        $subject = EmailTemplateEngine::renderSubject('order-delivered', [
            'order_number' => $order['order_number'],
        ]);

        $customerEmail = $order['customer_email'] ?? null;
        if ($customerEmail) {
            EmailQueue::enqueue($customerEmail, $subject, $html, 2);
        }

        return true;
    }

    /**
     * পাসওয়ার্ড রিসেট ইমেইল
     */
    public static function sendPasswordReset(string $email, string $resetToken): bool
    {
        $html = EmailTemplateEngine::render('password-reset', [
            'reset_url' => getenv('APP_URL') . '/auth?reset_token=' . $resetToken,
            'expires_in' => '১ ঘণ্টা',
        ]);

        $subject = EmailTemplateEngine::renderSubject('password-reset', []);
        return (new EmailService())->send($email, $subject, $html);
    }

    /**
     * ওয়েলকাম ইমেইল (নতুন রেজিস্ট্রেশন)
     */
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

    // ─── Helper Methods ───

    private static function getOrderData(string $orderId): ?array
    {
        $order = Database::fetchOne(
            "SELECT o.*, a.full_name, a.phone, a.division, a.district, a.thana, a.address_line 
             FROM orders o LEFT JOIN addresses a ON o.address_id = a.id 
             WHERE o.id = ?",
            [$orderId]
        );
        if (!$order) return null;

        $items = Database::fetchAll(
            "SELECT * FROM order_items WHERE order_id = ?",
            [$orderId]
        );

        // কাস্টমার ইমেইল খুঁজুন
        $customerEmail = null;
        if ($order['user_id']) {
            $customer = Database::fetchOne(
                "SELECT email FROM customers WHERE user_id = ?",
                [$order['user_id']]
            );
            $customerEmail = $customer['email'] ?? null;
            
            if (!$customerEmail) {
                $profile = Database::fetchOne(
                    "SELECT email FROM profiles WHERE user_id = ?",
                    [$order['user_id']]
                );
                $customerEmail = $profile['email'] ?? null;
            }
        }

        return [
            'order_number'   => $order['order_number'],
            'created_at'     => $order['created_at'],
            'subtotal'       => $order['subtotal'],
            'shipping_cost'  => $order['shipping_cost'],
            'discount_amount'=> $order['discount_amount'],
            'total'          => $order['total'],
            'payment_method' => $order['payment_method'],
            'customer_name'  => $order['full_name'] ?? 'গ্রাহক',
            'customer_email' => $customerEmail,
            'items'          => $items,
            'address' => [
                'full_name'    => $order['full_name'],
                'phone'        => $order['phone'],
                'division'     => $order['division'],
                'district'     => $order['district'],
                'thana'        => $order['thana'],
                'address_line' => $order['address_line'],
            ],
        ];
    }

    private static function buildItemsHtml(array $items): string
    {
        $html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;">';
        $html .= '<tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;border:1px solid #ddd;">পণ্য</th><th style="padding:8px;text-align:center;border:1px solid #ddd;">পরিমাণ</th><th style="padding:8px;text-align:right;border:1px solid #ddd;">মূল্য</th></tr>';
        
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
        return implode(', ', array_filter([
            $addr['address_line'] ?? '',
            $addr['thana'] ?? '',
            $addr['district'] ?? '',
            $addr['division'] ?? '',
        ]));
    }

    private static function getPaymentLabel(string $method): string
    {
        return match ($method) {
            'cod'           => 'ক্যাশ অন ডেলিভারি',
            'bkash'         => 'বিকাশ',
            'nagad'         => 'নগদ',
            'bank_transfer' => 'ব্যাংক ট্রান্সফার',
            'sslcommerz'    => 'SSLCommerz',
            'aamarpay'      => 'AamarPay',
            'surjopay'      => 'SurjoPay',
            default         => $method,
        };
    }
}
```

### `api/email.php` — ইমেইল API Endpoint

```php
<?php
// api/email.php — অর্ডার ইমেইল পাঠানোর API
declare(strict_types=1);
require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit(json_encode(['error' => 'Method not allowed']));
    }

    // Auth check
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $userId = Auth::validateToken(str_replace('Bearer ', '', $authHeader));
    if (!$userId) {
        http_response_code(401);
        exit(json_encode(['error' => 'Unauthorized']));
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $orderId = $body['orderId'] ?? '';
    $type = $body['type'] ?? 'confirmation';

    if (!$orderId) {
        http_response_code(400);
        exit(json_encode(['error' => 'Order ID required']));
    }

    // অর্ডার ownership চেক
    $order = Database::fetchOne("SELECT user_id FROM orders WHERE id = ?", [$orderId]);
    if (!$order) {
        http_response_code(404);
        exit(json_encode(['error' => 'Order not found']));
    }

    $isAdmin = Auth::isAdmin($userId);
    if ($order['user_id'] !== $userId && !$isAdmin) {
        http_response_code(403);
        exit(json_encode(['error' => 'Unauthorized access']));
    }

    $result = match ($type) {
        'confirmation' => OrderEmailService::sendOrderConfirmation($orderId),
        'shipped'      => OrderEmailService::sendShippingUpdate($orderId, $body['tracking_number'] ?? '', $body['courier_name'] ?? ''),
        'delivered'    => OrderEmailService::sendDeliveryConfirmation($orderId),
        default        => throw new \InvalidArgumentException('Invalid email type'),
    };

    echo json_encode(['success' => $result]);

} catch (\Throwable $e) {
    error_log("Email API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process email request']);
}
```

### `cron/process-email-queue.php` — Cron Job

```php
<?php
// crontab: * * * * * php /home/user/public_html/cron/process-email-queue.php
require_once __DIR__ . '/../vendor/autoload.php';

$sent = EmailQueue::processQueue(10);
echo date('Y-m-d H:i:s') . " — Processed: $sent emails\n";
```

### ইমেইল টেম্পলেট উদাহরণ: `templates/emails/order-confirmation.html`

```html
<!DOCTYPE html>
<html lang="bn">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Segoe UI',Tahoma,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
  <!-- Header -->
  <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
    <img src="{{site_logo}}" alt="{{site_name}}" width="140" style="max-width:140px;">
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 24px;">
    <h1 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">অর্ডার কনফার্মেশন ✅</h1>
    <p style="color:#333;font-size:15px;line-height:1.6;">
      প্রিয় <strong>{{customer_name}}</strong>,<br>
      আপনার অর্ডার <strong>#{{order_number}}</strong> সফলভাবে গৃহীত হয়েছে।
    </p>

    <div style="background:#f0f8ff;border-left:4px solid #2196F3;padding:12px 16px;margin:20px 0;border-radius:4px;">
      <strong>📅 অর্ডারের তারিখ:</strong> {{order_date}}<br>
      <strong>💳 পেমেন্ট:</strong> {{payment_method}}<br>
      <strong>📍 ঠিকানা:</strong> {{address}}
    </div>

    <!-- Order Items -->
    {{items_html}}

    <!-- Totals -->
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;">সাবটোটাল:</td><td style="text-align:right;padding:6px 0;">৳{{subtotal}}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">শিপিং:</td><td style="text-align:right;padding:6px 0;">৳{{shipping_cost}}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">ডিসকাউন্ট:</td><td style="text-align:right;padding:6px 0;color:#e53935;">-৳{{discount}}</td></tr>
      <tr style="border-top:2px solid #1a1a2e;"><td style="padding:10px 0;font-size:18px;font-weight:bold;">মোট:</td><td style="text-align:right;padding:10px 0;font-size:18px;font-weight:bold;color:#1a1a2e;">৳{{total}}</td></tr>
    </table>

    <div style="text-align:center;margin:24px 0;">
      <a href="{{track_url}}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">📦 অর্ডার ট্র্যাক করুন</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f5f5f5;padding:20px 24px;text-align:center;color:#999;font-size:12px;">
    <p>© {{year}} {{site_name}} | {{site_phone}} | {{site_email}}</p>
    <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
  </td></tr>
</table>
</body>
</html>
```

### MySQL `email_queue` ও `email_log` টেবিল

এই টেবিলগুলো `DATABASE_SCHEMA_MYSQL.sql`-এ যোগ করতে হবে:

```sql
-- ইমেইল কিউ
CREATE TABLE IF NOT EXISTS email_queue (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_body LONGTEXT NOT NULL,
    priority TINYINT DEFAULT 5,
    status ENUM('pending','processing','sent','failed') DEFAULT 'pending',
    attempts TINYINT DEFAULT 0,
    max_attempts TINYINT DEFAULT 3,
    error TEXT NULL,
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_priority (status, priority, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ইমেইল লগ
CREATE TABLE IF NOT EXISTS email_log (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    provider VARCHAR(50) DEFAULT 'smtp',
    status VARCHAR(20) DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Hostinger Cron Job সেটআপ

```
Hostinger hPanel > Cron Jobs > Add New:

Command:  php /home/u123456/public_html/cron/process-email-queue.php
Schedule: Every 1 minute (*/1 * * * *)
```

### অর্ডার API-তে ইন্টিগ্রেশন

`api/orders.php`-এ অর্ডার তৈরির পর এই লাইন যোগ করুন:

```php
// অর্ডার তৈরির পর স্বয়ংক্রিয়ভাবে কনফার্মেশন ইমেইল
OrderEmailService::sendOrderConfirmation($orderId);
```

অর্ডার স্ট্যাটাস আপডেটের সময়:

```php
// api/orders.php — স্ট্যাটাস আপডেট হ্যান্ডলার
if ($newStatus === 'shipped') {
    OrderEmailService::sendShippingUpdate($orderId, $trackingNumber, $courierName);
}
if ($newStatus === 'delivered') {
    OrderEmailService::sendDeliveryConfirmation($orderId);
}
```

---

## ফাইল আপলোড (ইমেজ)

### Image Upload Handler

```php
<?php
class ImageUpload
{
    private static array $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private static int $maxSize = 5 * 1024 * 1024; // 5MB

    public static function upload(array $file, string $folder = 'products'): string
    {
        // Validate
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Upload failed');
        }

        if ($file['size'] > self::$maxSize) {
            throw new \RuntimeException('File too large (max 5MB)');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::$allowedTypes)) {
            throw new \RuntimeException('Invalid file type');
        }

        // Generate safe filename
        $ext = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        };
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $uploadDir = __DIR__ . "/../storage/uploads/$folder/";
        
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $path = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            throw new \RuntimeException('Failed to save file');
        }

        return "/storage/uploads/$folder/$filename";
    }
}
```

---

## `.htaccess` (Apache Security)

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Block sensitive files
<FilesMatch "^\.env|composer\.(json|lock)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Disable directory listing
Options -Indexes

# PHP settings
php_value upload_max_filesize 10M
php_value post_max_size 12M
php_value max_execution_time 30
php_value max_input_vars 1000
```

---

## মাইগ্রেশন চেকলিস্ট

- [ ] MySQL 8.0+ ইনস্টল ও কনফিগার
- [ ] `DATABASE_SCHEMA_MYSQL.sql` রান করুন
- [ ] Supabase থেকে সকল টেবিলের ডেটা CSV export
- [ ] MySQL-এ ডেটা import
- [ ] `.env` ফাইল কনফিগার
- [ ] SSL সার্টিফিকেট সেটআপ
- [ ] পেমেন্ট গেটওয়ে credentials encrypt করে DB-তে সেভ
- [ ] SMTP email কনফিগার
- [ ] File upload directory তৈরি ও permission সেট (755)
- [ ] `.htaccess` security rules যোগ
- [ ] Rate limiting test
- [ ] পেমেন্ট sandbox test
- [ ] ডেলিভারি API test
- [ ] সকল CRUD operations test
- [ ] Production deploy ও final security audit

---

## সাপোর্ট

ডকুমেন্টেশন সম্পর্কিত প্রশ্নের জন্য ডেভেলপার টিমের সাথে যোগাযোগ করুন।
