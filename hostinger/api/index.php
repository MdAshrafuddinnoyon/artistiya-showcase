<?php
/**
 * Artistiya E-Commerce — Central API Router
 * Routes all /api/* requests to appropriate handlers.
 * 
 * Supports:
 *   - Generic CRUD: GET/POST/PATCH/DELETE /api/{table}
 *   - Auth: /api/auth/{action}
 *   - Storage: /api/storage/{bucket}/{action}
 *   - Functions: /api/functions/{name}
 *   - Specialized admin/public endpoints
 */

require_once __DIR__ . '/../bootstrap.php';

$route = $_GET['route'] ?? '';
$route = trim($route, '/');
$method = $_SERVER['REQUEST_METHOD'];

// ── Route Definitions ────────────────────────────────────────

// Auth routes
if (preg_match('#^auth/(.+)$#', $route, $m)) {
    $action = $m[1];
    $map = [
        'login'          => __DIR__ . '/auth/login.php',
        'signup'         => __DIR__ . '/auth/register.php',
        'register'       => __DIR__ . '/auth/register.php',
        'logout'         => __DIR__ . '/auth/logout.php',
        'session'        => __DIR__ . '/auth/session.php',
        'profile'        => __DIR__ . '/auth/profile.php',
        'reset-password' => __DIR__ . '/auth/reset-password.php',
    ];
    if (isset($map[$action]) && file_exists($map[$action])) {
        require_once $map[$action];
        exit;
    }
    jsonError('Auth route not found', 404);
}

// Storage routes
if (preg_match('#^storage/([^/]+)/(.+)$#', $route, $m)) {
    $_GET['bucket'] = $m[1];
    $_GET['action'] = $m[2];
    require_once __DIR__ . '/storage/handler.php';
    exit;
}

// Functions routes (replaces Supabase Edge Functions)
// Supports sub-paths like functions/bkash-payment/create
if (preg_match('#^functions/(.+)$#', $route, $m)) {
    $_GET['function_name'] = $m[1];
    require_once __DIR__ . '/functions/handler.php';
    exit;
}

// Admin routes
if (preg_match('#^admin/(.+)$#', $route, $m)) {
    $action = $m[1];
    $map = [
        'dashboard'  => __DIR__ . '/admin/dashboard.php',
        'customers'  => __DIR__ . '/admin/customers.php',
        'settings'   => __DIR__ . '/admin/settings.php',
    ];
    if (isset($map[$action]) && file_exists($map[$action])) {
        require_once $map[$action];
        exit;
    }
    jsonError('Admin route not found', 404);
}

// Public routes (no auth required)
if (preg_match('#^public/(.+)$#', $route, $m)) {
    $endpoint = $m[1];
    $file = __DIR__ . '/public/' . basename($endpoint) . '.php';
    if (file_exists($file)) {
        require_once $file;
        exit;
    }
    jsonError('Public route not found', 404);
}

// Specialized routes
$specialRoutes = [
    'orders/create'     => __DIR__ . '/orders/create.php',
    'orders/list'       => __DIR__ . '/orders/list.php',
    'orders/manage'     => __DIR__ . '/orders/manage.php',
    'products/list'     => __DIR__ . '/products/list.php',
    'products/detail'   => __DIR__ . '/products/detail.php',
    'products/manage'   => __DIR__ . '/products/manage.php',
    'categories/list'   => __DIR__ . '/categories/list.php',
    'categories/manage' => __DIR__ . '/categories/manage.php',
    'upload'            => __DIR__ . '/upload/file.php',
    'email/send'        => __DIR__ . '/email/send.php',
    'sms/send'          => __DIR__ . '/sms/send.php',
    'delivery/dispatch' => __DIR__ . '/delivery/dispatch.php',
    'payments/bkash'      => __DIR__ . '/payments/bkash.php',
    'payments/nagad'      => __DIR__ . '/payments/nagad.php',
    'payments/sslcommerz' => __DIR__ . '/payments/sslcommerz.php',
    'payments/aamarpay'   => __DIR__ . '/payments/aamarpay.php',
    'payments/surjopay'   => __DIR__ . '/payments/surjopay.php',
];

if (isset($specialRoutes[$route]) && file_exists($specialRoutes[$route])) {
    require_once $specialRoutes[$route];
    exit;
}

// ── Generic CRUD Handler ─────────────────────────────────────
// Handles: GET/POST/PATCH/DELETE /api/{table_name}?eq.field=value&...
// This replaces ALL supabase.from("table").select/insert/update/delete calls

$tableName = $route;

// Validate table name (prevent SQL injection)
if (!preg_match('/^[a-z_]+$/', $tableName)) {
    jsonError('Invalid endpoint', 404);
}

// Allowed tables whitelist
$allowedTables = [
    'abandoned_carts', 'addresses', 'announcement_bar', 'blocked_customers',
    'blog_categories', 'blog_posts', 'blog_settings', 'bundle_products',
    'cart_items', 'categories', 'category_display_settings', 'certifications',
    'checkout_fraud_settings', 'checkout_settings', 'collections', 'collection_products',
    'content_pages', 'crm_reports', 'currency_rates', 'custom_order_requests',
    'customer_discount_credits', 'customers', 'customization_settings',
    'delivery_partners', 'delivery_providers', 'delivery_zones',
    'email_settings', 'email_templates', 'faq_items', 'featured_sections',
    'filter_settings', 'footer_link_groups', 'footer_links', 'footer_payment_banners',
    'gallery_albums', 'gallery_items', 'hero_slides', 'homepage_content',
    'homepage_sections', 'instagram_posts', 'invoice_settings', 'leads',
    'making_section', 'menu_items', 'menu_sub_items', 'newsletter_settings',
    'newsletter_subscribers', 'notifications', 'order_fraud_flags', 'order_items',
    'orders', 'payment_providers', 'payment_transactions', 'product_bundles',
    'product_colors', 'product_reviews', 'product_sizes', 'product_variants',
    'products', 'profiles', 'promo_code_usage', 'promo_codes',
    'qr_discount_settings', 'reviews', 'shop_page_settings', 'shop_settings',
    'site_branding', 'site_integrations', 'site_settings', 'sms_settings',
    'social_links', 'team_members', 'testimonials', 'theme_settings',
    'upsell_offers', 'user_roles', 'wishlist_items', 'youtube_videos',
];

if (!in_array($tableName, $allowedTables)) {
    jsonError('Table not found: ' . $tableName, 404);
}

require_once __DIR__ . '/crud.php';
handleCRUD($tableName);
