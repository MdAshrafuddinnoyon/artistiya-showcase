# ফ্রন্টএন্ড Supabase SDK → PHP API মাইগ্রেশন গাইড

## 📋 সংক্ষিপ্ত বিবরণ

এই গাইডটি বর্ণনা করে কিভাবে ফ্রন্টএন্ড কোডে ব্যবহৃত **সমস্ত Supabase SDK কল** PHP/MySQL ব্যাকএন্ডের REST API দিয়ে প্রতিস্থাপন করতে হবে। বর্তমানে ১২৮টি ফাইলে Supabase ক্লায়েন্ট ব্যবহৃত হচ্ছে।

---

## 🔧 ধাপ ১: Supabase ক্লায়েন্ট প্রতিস্থাপন

### বর্তমান (Supabase)
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

### নতুন (PHP API ক্লায়েন্ট)
```typescript
// src/integrations/api/client.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. https://yourdomain.com/api

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };
      
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: new Error(err.message || res.statusText) };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  // === CRUD Methods (Supabase .from() replacement) ===
  
  async select<T>(table: string, params?: {
    columns?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
    eq?: Record<string, any>;
    in?: Record<string, any[]>;
    single?: boolean;
  }): Promise<{ data: T | null; error: Error | null }> {
    const query = new URLSearchParams();
    if (params?.columns) query.set('select', params.columns);
    if (params?.order) query.set('order', `${params.order.column}.${params.order.ascending !== false ? 'asc' : 'desc'}`);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.single) query.set('single', 'true');
    if (params?.eq) Object.entries(params.eq).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    if (params?.in) Object.entries(params.in).forEach(([k, v]) => query.set(`in.${k}`, JSON.stringify(v)));
    if (params?.filters) Object.entries(params.filters).forEach(([k, v]) => query.set(k, String(v)));

    return this.request<T>(`/${table}?${query.toString()}`);
  }

  async insert<T>(table: string, data: Record<string, any> | Record<string, any>[]): Promise<{ data: T | null; error: Error | null }> {
    return this.request<T>(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(table: string, data: Record<string, any>, filters: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    return this.request<T>(`/${table}?${query.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(table: string, filters: Record<string, any>): Promise<{ error: Error | null }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => query.set(`eq.${k}`, String(v)));
    return this.request(`/${table}?${query.toString()}`, { method: 'DELETE' });
  }

  // === Auth Methods ===
  
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return this.request<{ user: any; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...metadata }),
    });
  }

  async signIn(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.token) this.setToken(result.data.token);
    return result;
  }

  async signOut() {
    this.setToken(null);
    return { error: null };
  }

  async getSession() {
    const token = this.getToken();
    if (!token) return { data: { session: null }, error: null };
    return this.request<{ session: any }>('/auth/session');
  }

  // === Storage Methods ===
  
  async uploadFile(bucket: string, path: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/storage/${bucket}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    return `${API_BASE}/storage/${bucket}/${path}`;
  }

  async removeFiles(bucket: string, paths: string[]) {
    return this.request(`/storage/${bucket}/delete`, {
      method: 'POST',
      body: JSON.stringify({ paths }),
    });
  }

  // === Edge Functions (→ PHP API endpoints) ===
  
  async invoke<T>(functionName: string, options?: { body?: any }) {
    return this.request<T>(`/functions/${functionName}`, {
      method: 'POST',
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  }
}

export const api = new ApiClient();
```

---

## 🔄 ধাপ ২: সকল Supabase কল প্যাটার্ন ম্যাপিং

### ২.১ ডেটা পড়া (SELECT)

| Supabase প্যাটার্ন | PHP API প্রতিস্থাপন |
|---|---|
| `supabase.from("products").select("*")` | `api.select("products")` |
| `.select("*").eq("id", id).single()` | `api.select("products", { eq: { id }, single: true })` |
| `.select("*").order("created_at", { ascending: false })` | `api.select("products", { order: { column: "created_at", ascending: false } })` |
| `.select("*").in("id", ids)` | `api.select("products", { in: { id: ids } })` |
| `.select("*, categories(*)")` | `api.select("products", { columns: "*, categories(*)" })` — PHP-তে JOIN করে response দিতে হবে |
| `.select("*").eq("is_active", true).limit(10)` | `api.select("products", { eq: { is_active: true }, limit: 10 })` |
| `.select("*").ilike("name", `%${search}%`)` | `api.select("products", { filters: { "ilike.name": `%${search}%` } })` |
| `.select("*").gte("price", min).lte("price", max)` | `api.select("products", { filters: { "gte.price": min, "lte.price": max } })` |
| `.select("*", { count: "exact" })` | `api.select("products", { filters: { count: "exact" } })` — PHP header এ `X-Total-Count` দিতে হবে |

### ২.২ ডেটা তৈরি (INSERT)

| Supabase | PHP API |
|---|---|
| `supabase.from("orders").insert({ ... })` | `api.insert("orders", { ... })` |
| `.insert([item1, item2])` | `api.insert("order_items", [item1, item2])` |
| `.insert({ ... }).select().single()` | `api.insert("products", { ... })` — PHP response এ created row ফেরত দেবে |

### ২.৩ ডেটা আপডেট (UPDATE)

| Supabase | PHP API |
|---|---|
| `supabase.from("products").update({ name: "X" }).eq("id", id)` | `api.update("products", { name: "X" }, { id })` |
| `.update({ is_active: false }).in("id", ids)` | `api.update("products", { is_active: false }, { "in.id": ids })` |

### ২.৪ ডেটা মুছা (DELETE)

| Supabase | PHP API |
|---|---|
| `supabase.from("products").delete().eq("id", id)` | `api.delete("products", { id })` |
| `.delete().in("id", ids)` | `api.delete("products", { "in.id": ids })` |

---

## 🔐 ধাপ ৩: Authentication মাইগ্রেশন

### বর্তমান (Supabase Auth)
```typescript
// src/hooks/useAuth.tsx
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
});

await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
await supabase.auth.getSession();
```

### নতুন (JWT-based PHP Auth)
```typescript
// src/hooks/useAuth.tsx — প্রতিস্থাপিত সংস্করণ
import { api } from "@/integrations/api/client";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getSession().then(({ data }) => {
        if (data?.session?.user) setUser(data.session.user);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password, fullName) => {
    const { data, error } = await api.signUp(email, password, { full_name: fullName });
    return { error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await api.signIn(email, password);
    if (data?.user) setUser(data.user);
    return { error };
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
  };
  // ...
};
```

### PHP ব্যাকএন্ড Auth API
```php
// api/auth/login.php
<?php
require_once '../includes/Database.php';
require_once '../includes/JWT.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $input['password'] ?? '';

$db = Database::getInstance();
$stmt = $db->prepare("SELECT id, email, password_hash, raw_user_meta_data FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid credentials']);
    exit;
}

$token = JWT::encode([
    'sub' => $user['id'],
    'email' => $user['email'],
    'role' => getUserRole($user['id']),
    'exp' => time() + 86400 * 7, // 7 days
]);

// Check admin role for redirect
$isAdmin = getUserRole($user['id']) === 'admin';

echo json_encode([
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'user_metadata' => json_decode($user['raw_user_meta_data'], true),
    ],
    'token' => $token,
    'is_admin' => $isAdmin,
    'redirect' => $isAdmin ? '/admin' : '/',
]);

// api/auth/signup.php
<?php
require_once '../includes/Database.php';
require_once '../includes/JWT.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $input['password'] ?? '';
$fullName = htmlspecialchars($input['full_name'] ?? '', ENT_QUOTES, 'UTF-8');

if (!$email || strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid email or password (min 8 chars)']);
    exit;
}

$db = Database::getInstance();

// Check duplicate
$check = $db->prepare("SELECT id FROM users WHERE email = ?");
$check->execute([$email]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['message' => 'Email already registered']);
    exit;
}

$userId = bin2hex(random_bytes(16)); // UUID alternative
$hash = password_hash($password, PASSWORD_ARGON2ID);
$meta = json_encode(['full_name' => $fullName]);

$stmt = $db->prepare("INSERT INTO users (id, email, password_hash, raw_user_meta_data) VALUES (?, ?, ?, ?)");
$stmt->execute([$userId, $email, $hash, $meta]);

// Auto-create profile (replaces Supabase trigger)
$profileStmt = $db->prepare("INSERT INTO profiles (id, full_name) VALUES (?, ?)");
$profileStmt->execute([$userId, $fullName]);

echo json_encode(['user' => ['id' => $userId, 'email' => $email], 'message' => 'Registration successful']);

// api/auth/session.php
<?php
require_once '../includes/JWT.php';
require_once '../includes/Auth.php';

$user = Auth::getCurrentUser(); // JWT থেকে user extract
if (!$user) {
    http_response_code(401);
    echo json_encode(['session' => null]);
    exit;
}

echo json_encode(['session' => ['user' => $user]]);
```

---

## 📂 ধাপ ৪: Storage মাইগ্রেশন

### বর্তমান Supabase Storage ব্যবহার (৪টি ফাইলে)
```typescript
// Upload
const { error } = await supabase.storage
  .from('product-images')
  .upload(filePath, file, { cacheControl: '3600', upsert: false });

// Get Public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(filePath);

// Delete
await supabase.storage.from('product-images').remove([filePath]);
```

### নতুন PHP Storage API
```typescript
// Upload
const { error } = await api.uploadFile('product-images', filePath, file);

// Get Public URL
const publicUrl = api.getPublicUrl('product-images', filePath);

// Delete
await api.removeFiles('product-images', [filePath]);
```

### PHP Storage Backend
```php
// api/storage/upload.php
<?php
require_once '../includes/Auth.php';

$user = Auth::requireAuth();
$bucket = basename($_GET['bucket'] ?? '');
$allowedBuckets = ['product-images', 'custom-designs', 'media', 'testimonials'];

if (!in_array($bucket, $allowedBuckets)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid bucket']);
    exit;
}

$file = $_FILES['file'] ?? null;
$path = $_POST['path'] ?? '';

if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'No file uploaded']);
    exit;
}

// Validate file type
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowed)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid file type']);
    exit;
}

// Max 10MB
if ($file['size'] > 10 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['message' => 'File too large (max 10MB)']);
    exit;
}

$uploadDir = __DIR__ . "/../storage/uploads/{$bucket}/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$targetPath = $uploadDir . basename($path);
move_uploaded_file($file['tmp_name'], $targetPath);

$publicUrl = "/storage/uploads/{$bucket}/{$path}";
echo json_encode(['path' => $path, 'publicUrl' => $publicUrl]);
```

### Bucket ম্যাপিং

| Supabase Bucket | PHP Directory | ব্যবহার |
|---|---|---|
| `product-images` | `storage/uploads/product-images/` | প্রোডাক্ট ছবি |
| `custom-designs` | `storage/uploads/custom-designs/` | কাস্টম অর্ডার ডিজাইন |
| `media` | `storage/uploads/media/` | মিডিয়া ম্যানেজার |
| `testimonials` | `storage/uploads/testimonials/` | টেস্টিমোনিয়াল ছবি |

---

## ⚡ ধাপ ৫: Edge Functions → PHP API Endpoints

### বর্তমান Edge Function কল
```typescript
await supabase.functions.invoke("create-order", { body: orderPayload });
await supabase.functions.invoke("bkash-payment/create", { body: { amount, orderId } });
await supabase.functions.invoke("send-order-email", { body: emailData });
```

### নতুন PHP API কল
```typescript
await api.invoke("create-order", { body: orderPayload });
await api.invoke("bkash-payment/create", { body: { amount, orderId } });
await api.invoke("send-order-email", { body: emailData });
```

### সম্পূর্ণ Edge Function → PHP Endpoint ম্যাপ

| Edge Function | PHP Endpoint | HTTP Method | বিবরণ |
|---|---|---|---|
| `create-order` | `api/functions/create-order.php` | POST | অর্ডার তৈরি, স্টক যাচাই, মূল্য ভেরিফাই |
| `sslcommerz-payment` | `api/functions/sslcommerz-payment.php` | POST | SSLCommerz পেমেন্ট init + IPN |
| `bkash-payment` | `api/functions/bkash-payment.php` | POST | bKash Tokenized Checkout |
| `nagad-payment` | `api/functions/nagad-payment.php` | POST | Nagad পেমেন্ট |
| `aamarpay-payment` | `api/functions/aamarpay-payment.php` | POST | AamarPay IPN |
| `surjopay-payment` | `api/functions/surjopay-payment.php` | POST | SurjoPay verify |
| `send-order-email` | `api/functions/send-order-email.php` | POST | SMTP/Resend ইমেইল |
| `generate-invoice` | `api/functions/generate-invoice.php` | POST | PDF ইনভয়েস |
| `generate-delivery-slip` | `api/functions/generate-delivery-slip.php` | POST | ডেলিভারি স্লিপ |
| `delivery-api` | `api/functions/delivery-api.php` | POST | কুরিয়ার API প্রক্সি |
| `encrypt-credentials` | `api/functions/encrypt-credentials.php` | POST | AES-256 এনক্রিপশন |
| `fetch-google-reviews` | `api/functions/fetch-google-reviews.php` | POST | Google Places API |

---

## 📋 ধাপ ৬: ফাইল-ভিত্তিক মাইগ্রেশন চেকলিস্ট

### 🔴 সর্বোচ্চ অগ্রাধিকার (Core Functionality)

| ফাইল | Supabase ব্যবহার | পরিবর্তন |
|---|---|---|
| `src/integrations/supabase/client.ts` | ক্লায়েন্ট ইনিশিয়ালাইজেশন | `src/integrations/api/client.ts` দিয়ে প্রতিস্থাপন |
| `src/hooks/useAuth.tsx` | `supabase.auth.*` | JWT-based auth দিয়ে প্রতিস্থাপন |
| `src/hooks/useAdmin.tsx` | `supabase.from("user_roles")` | `api.select("user_roles")` |
| `src/hooks/useCart.tsx` | `supabase.from("cart_items")` | `api.select/insert/update/delete("cart_items")` |
| `src/hooks/useWishlist.tsx` | `supabase.from("wishlist_items")` | `api.select/insert/delete("wishlist_items")` |
| `src/hooks/usePayment.tsx` | `supabase.functions.invoke()` | `api.invoke()` |
| `src/pages/Checkout.tsx` | `supabase.functions.invoke("create-order")` | `api.invoke("create-order")` |

### 🟡 মাঝারি অগ্রাধিকার (Admin Panel)

| ফাইল | Supabase ব্যবহার |
|---|---|
| `src/components/admin/AdminProducts.tsx` | products CRUD |
| `src/components/admin/AdminOrders.tsx` | orders CRUD |
| `src/components/admin/AdminCategories.tsx` | categories CRUD |
| `src/components/admin/AdminCustomers.tsx` | customers CRUD |
| `src/components/admin/AdminCRM.tsx` | CRM data queries |
| `src/components/admin/AdminHeroSlider.tsx` | hero_slides CRUD |
| `src/components/admin/AdminBlogPosts.tsx` | blog_posts CRUD |
| `src/components/admin/AdminPromoCodes.tsx` | promo_codes CRUD |
| `src/components/admin/AdminCollections.tsx` | collections CRUD |
| `src/components/admin/AdminPaymentProviders.tsx` | payment_providers CRUD |
| `src/components/admin/AdminDeliveryProviders.tsx` | delivery_providers CRUD |
| `src/components/admin/AdminSettings.tsx` | site_branding, settings CRUD |
| `src/components/admin/ProductImageUpload.tsx` | `supabase.storage` upload/delete |
| `src/components/admin/ImageUploadZone.tsx` | `supabase.storage` upload |
| `src/components/admin/MediaPickerModal.tsx` | `supabase.storage` list/upload |

### 🟢 নিম্ন অগ্রাধিকার (Public Pages)

| ফাইল | Supabase ব্যবহার |
|---|---|
| `src/pages/Index.tsx` | homepage data read |
| `src/pages/Shop.tsx` | products list + filter |
| `src/pages/ProductDetail.tsx` | single product read |
| `src/pages/Blog.tsx` | blog posts read |
| `src/pages/Gallery.tsx` | gallery read |
| `src/pages/Contact.tsx` | leads insert |
| `src/pages/FAQ.tsx` | faq_items read |
| `src/components/layout/Header.tsx` | site_branding, menu read |
| `src/components/layout/Footer.tsx` | footer_links, branding read |

---

## 🔄 ধাপ ৭: React Query ক্যাশিং — কোনো পরিবর্তন নেই

`@tanstack/react-query` ব্যবহার অপরিবর্তিত থাকবে। শুধু `queryFn` এর ভিতরে Supabase কলগুলো API কল দিয়ে রিপ্লেস করুন:

```typescript
// আগে
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

// পরে
const { data } = useQuery({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await api.select("products", {
      eq: { is_active: true },
      order: { column: "created_at", ascending: false },
    });
    if (error) throw error;
    return data;
  },
});
```

---

## 🛡️ ধাপ ৮: RLS → PHP Middleware রিপ্লেসমেন্ট

Supabase-এ Row-Level Security (RLS) ডাটাবেজ লেভেলে access control করে। PHP-তে এগুলো middleware দিয়ে করতে হবে:

### PHP Auth Middleware
```php
// includes/Auth.php
<?php
class Auth {
    public static function getCurrentUser(): ?array {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/', $header, $m)) return null;
        
        try {
            $payload = JWT::decode($m[1]);
            if ($payload['exp'] < time()) return null;
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function requireAuth(): array {
        $user = self::getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::requireAuth();
        if (($user['role'] ?? '') !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden: Admin only']);
            exit;
        }
        return $user;
    }

    public static function isAdmin(string $userId): bool {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'");
        $stmt->execute([$userId]);
        return (bool)$stmt->fetch();
    }
}
```

### RLS Policy → PHP Check ম্যাপিং

| RLS Policy | PHP Middleware |
|---|---|
| `is_admin(auth.uid())` | `Auth::requireAdmin()` |
| `auth.uid() = user_id` | `$user['sub'] === $row['user_id']` check |
| `is_active = true` (public read) | No auth, query: `WHERE is_active = 1` |
| `can_submit_lead(email, phone)` | PHP rate-limit check function |
| `can_subscribe_newsletter(email)` | PHP duplicate check |

---

## 🌐 ধাপ ৯: Environment Variables পরিবর্তন

### আগে (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

### পরে (.env)
```
VITE_API_BASE_URL=https://yourdomain.com/api
```

---

## 📂 ধাপ ১০: PHP প্রজেক্ট ফাইল স্ট্রাকচার

```
php-backend/
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── signup.php
│   │   ├── session.php
│   │   └── logout.php
│   ├── functions/
│   │   ├── create-order.php
│   │   ├── bkash-payment.php
│   │   ├── nagad-payment.php
│   │   ├── sslcommerz-payment.php
│   │   ├── aamarpay-payment.php
│   │   ├── surjopay-payment.php
│   │   ├── send-order-email.php
│   │   ├── generate-invoice.php
│   │   ├── generate-delivery-slip.php
│   │   ├── delivery-api.php
│   │   ├── encrypt-credentials.php
│   │   └── fetch-google-reviews.php
│   ├── storage/
│   │   ├── upload.php
│   │   ├── delete.php
│   │   └── list.php
│   ├── products.php         ← CRUD router
│   ├── categories.php
│   ├── orders.php
│   ├── customers.php
│   ├── reviews.php
│   ├── ... (প্রতিটি table-এর জন্য)
│   └── index.php            ← Router
├── includes/
│   ├── Database.php         ← PDO singleton
│   ├── JWT.php              ← JWT encode/decode
│   ├── Auth.php             ← Auth middleware
│   ├── Encryption.php       ← AES-256
│   ├── Validator.php        ← Input validation
│   └── RateLimit.php        ← Rate limiting
├── storage/
│   └── uploads/
│       ├── product-images/
│       ├── custom-designs/
│       ├── media/
│       └── testimonials/
├── .htaccess                ← URL rewriting + security
├── .env                     ← DB credentials, JWT secret
└── composer.json
```

---

## ⚠️ ধাপ ১১: গুরুত্বপূর্ণ সতর্কতা

### Supabase-specific ফিচার যা PHP-তে ম্যানুয়ালি তৈরি করতে হবে:

1. **Realtime Subscriptions** — Supabase realtime ব্যবহৃত হলে WebSocket (Ratchet/Swoole) বা polling দিয়ে প্রতিস্থাপন
2. **Row-Level Security** — PHP middleware দিয়ে implement (উপরে বর্ণিত)
3. **Auto-generated Types** — `types.ts` ম্যানুয়ালি maintain অথবা codegen tool ব্যবহার
4. **Database Triggers** — MySQL triggers দিয়ে প্রতিস্থাপন (DATABASE_SCHEMA_MYSQL.sql এ আছে)
5. **Storage Policies** — PHP-তে file upload validation + auth check

### Import পাথ Find & Replace

মাইগ্রেশনের সময় সবচেয়ে দ্রুত উপায়:
```bash
# সকল ফাইলে Supabase import রিপ্লেস
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  's|import { supabase } from "@/integrations/supabase/client"|import { api } from "@/integrations/api/client"|g'

# supabase.from() → api.select/insert/update/delete() — ম্যানুয়ালি করতে হবে
```

---

## ✅ মাইগ্রেশন চেকলিস্ট সারাংশ

- [ ] `src/integrations/api/client.ts` তৈরি করুন
- [ ] `.env` আপডেট করুন (`VITE_API_BASE_URL`)
- [ ] `useAuth.tsx` মাইগ্রেট করুন (JWT-based)
- [ ] সকল `supabase.from()` কল রিপ্লেস করুন (১২৮ ফাইল)
- [ ] `supabase.storage` কল রিপ্লেস করুন (৪ ফাইল)
- [ ] `supabase.functions.invoke()` কল রিপ্লেস করুন (১২ endpoints)
- [ ] PHP backend API endpoints তৈরি করুন
- [ ] PHP Auth middleware implement করুন
- [ ] CORS headers সেটআপ করুন
- [ ] সকল API endpoint টেস্ট করুন
- [ ] Supabase SDK dependency রিমুভ করুন (`@supabase/supabase-js`)
