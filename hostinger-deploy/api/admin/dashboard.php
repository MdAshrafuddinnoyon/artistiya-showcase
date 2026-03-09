<?php
/**
 * GET /api/admin/dashboard — Dashboard stats (admin only)
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();

// Total orders
$totalOrders = (int) $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();

// Revenue
$totalRevenue = (float) $pdo->query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled'")->fetchColumn();

// Today's orders
$todayOrders = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();

// Pending orders
$pendingOrders = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn();

// Total products
$totalProducts = (int) $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

// Total customers
$totalCustomers = (int) $pdo->query("SELECT COUNT(*) FROM customers")->fetchColumn();

// Low stock products
$lowStock = (int) $pdo->query("SELECT COUNT(*) FROM products WHERE stock IS NOT NULL AND stock <= 5 AND is_active = 1")->fetchColumn();

// Recent orders
$stmt = $pdo->query(
    "SELECT o.id, o.order_number, o.total, o.status, o.created_at, a.full_name as customer_name
     FROM orders o
     LEFT JOIN addresses a ON a.id = o.address_id
     ORDER BY o.created_at DESC LIMIT 10"
);
$recentOrders = $stmt->fetchAll();

// Monthly revenue (last 6 months)
$stmt = $pdo->query(
    "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue, COUNT(*) as orders
     FROM orders WHERE status != 'cancelled'
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month DESC LIMIT 6"
);
$monthlyRevenue = $stmt->fetchAll();

jsonResponse([
    'total_orders'    => $totalOrders,
    'total_revenue'   => $totalRevenue,
    'today_orders'    => $todayOrders,
    'pending_orders'  => $pendingOrders,
    'total_products'  => $totalProducts,
    'total_customers' => $totalCustomers,
    'low_stock'       => $lowStock,
    'recent_orders'   => $recentOrders,
    'monthly_revenue' => $monthlyRevenue,
]);
