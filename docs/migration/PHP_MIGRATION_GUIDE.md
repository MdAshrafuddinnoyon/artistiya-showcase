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
9. [সিকিউরিটি](#সিকিউরিটি)
10. [ফাইল আপলোড](#ফাইল-আপলোড)

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
