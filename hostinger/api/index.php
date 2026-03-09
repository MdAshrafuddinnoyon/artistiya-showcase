<?php
/**
 * Artistiya E-Commerce — API Router
 * Routes all /api/* requests to the correct handler.
 * 
 * URL Rewriting (via .htaccess):
 *   /api/auth/login       → api/index.php?route=auth/login
 *   /api/products          → api/index.php?route=products
 *   /api/products/{id}     → api/index.php?route=products/{id}
 */

require_once __DIR__ . '/../bootstrap.php';

// ============================================================
// PARSE ROUTE
// ============================================================
$route = trim($_GET['route'] ?? '', '/');
$method = $_SERVER['REQUEST_METHOD'];
$segments = array_filter(explode('/', $route));
$group = $segments[0] ?? '';
$action = $segments[1] ?? '';
$param = $segments[2] ?? null;

// Store route param for handlers
$_REQUEST['_route_param'] = $param;
$_REQUEST['_route_action'] = $action;
$_REQUEST['_route_segments'] = $segments;

// ============================================================
// ROUTE MAP
// ============================================================
$routes = [
    // Auth
    'auth/login'           => 'auth/login.php',
    'auth/register'        => 'auth/register.php',
    'auth/profile'         => 'auth/profile.php',
    'auth/reset-password'  => 'auth/reset-password.php',
    
    // Products
    'products'             => 'products/list.php',
    'products/manage'      => 'products/manage.php',
    
    // Categories
    'categories'           => 'categories/list.php',
    'categories/manage'    => 'categories/manage.php',
    
    // Orders
    'orders'               => 'orders/list.php',
    'orders/create'        => 'orders/create.php',
    'orders/manage'        => 'orders/manage.php',
    
    // Payments
    'payments/bkash'       => 'payments/bkash.php',
    'payments/nagad'       => 'payments/nagad.php',
    'payments/sslcommerz'  => 'payments/sslcommerz.php',
    'payments/aamarpay'    => 'payments/aamarpay.php',
    'payments/surjopay'    => 'payments/surjopay.php',
    
    // Delivery
    'delivery/dispatch'    => 'delivery/dispatch.php',
    
    // Email & SMS
    'email/send'           => 'email/send.php',
    'sms/send'             => 'sms/send.php',
    
    // Upload
    'upload'               => 'upload/file.php',
    'upload/file'          => 'upload/file.php',
    
    // Admin
    'admin/dashboard'      => 'admin/dashboard.php',
    'admin/settings'       => 'admin/settings.php',
    'admin/customers'      => 'admin/customers.php',
    
    // Public data endpoints
    'hero-slides'          => 'public/hero-slides.php',
    'announcements'        => 'public/announcements.php',
    'collections'          => 'public/collections.php',
    'testimonials'         => 'public/testimonials.php',
    'homepage'             => 'public/homepage.php',
    'site-branding'        => 'public/site-branding.php',
    'footer'               => 'public/footer.php',
    'faq'                  => 'public/faq.php',
    'blog'                 => 'public/blog.php',
    'gallery'              => 'public/gallery.php',
    'reviews'              => 'public/reviews.php',
    'delivery-zones'       => 'public/delivery-zones.php',
    'social-links'         => 'public/social-links.php',
    'menu'                 => 'public/menu.php',
    'content-pages'        => 'public/content-pages.php',
];

// ============================================================
// ROUTE MATCHING
// ============================================================

// Try exact match first
$routeKey = implode('/', array_slice($segments, 0, 2));
if (!isset($routes[$routeKey])) {
    // Try single segment match (e.g., "products" with ID as next segment)
    $routeKey = $group;
}

if (!isset($routes[$routeKey])) {
    // Try with detail - products/{uuid}
    if ($group && $action && preg_match('/^[0-9a-f\-]{36}$/i', $action)) {
        // This is a detail request: products/{id}
        $_REQUEST['_route_param'] = $action;
        $routeFile = $group . '/detail.php';
        if (file_exists(__DIR__ . '/' . $routeFile)) {
            require __DIR__ . '/' . $routeFile;
            exit;
        }
        // Fallback to list.php with ID param
        $routeKey = $group;
    }
}

if (isset($routes[$routeKey])) {
    $file = __DIR__ . '/' . $routes[$routeKey];
    if (file_exists($file)) {
        require $file;
        exit;
    }
}

// ============================================================
// HEALTH CHECK
// ============================================================
if ($route === '' || $route === 'health') {
    try {
        $pdo = getDB();
        $version = $pdo->query("SELECT VERSION()")->fetchColumn();
        jsonResponse([
            'status'      => 'ok',
            'app'         => 'Artistiya E-Commerce API',
            'php_version' => PHP_VERSION,
            'db_version'  => $version,
            'timestamp'   => date('c'),
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'status' => 'error',
            'error'  => 'Database connection failed',
        ], 500);
    }
}

// ============================================================
// 404 — ROUTE NOT FOUND
// ============================================================
jsonError("Route not found: /api/{$route}", 404);
