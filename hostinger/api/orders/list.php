<?php
/**
 * GET /api/orders — List orders (user's own or admin all)
 */

require_once __DIR__ . '/../middleware.php';

$user = requireAuth();
$pdo = getDB();

$page = max(1, intval($_GET['page'] ?? 1));
$perPage = min(100, max(1, intval($_GET['per_page'] ?? 20)));
$status = $_GET['status'] ?? null;

// Check if admin
$isAdmin = false;
$stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'");
$stmt->execute([$user['user_id']]);
if ($stmt->fetch()) $isAdmin = true;

$where = [];
$params = [];

if (!$isAdmin) {
    $where[] = "o.user_id = ?";
    $params[] = $user['user_id'];
}

if ($status) {
    $where[] = "o.status = ?";
    $params[] = $status;
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM orders o {$whereSQL}");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

// Fetch
$offset = ($page - 1) * $perPage;
$stmt = $pdo->prepare(
    "SELECT o.*, a.full_name as customer_name, a.phone as customer_phone, a.district, a.division
     FROM orders o
     LEFT JOIN addresses a ON a.id = o.address_id
     {$whereSQL}
     ORDER BY o.created_at DESC
     LIMIT {$perPage} OFFSET {$offset}"
);
$stmt->execute($params);
$orders = $stmt->fetchAll();

// Get items for each order
foreach ($orders as &$order) {
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$order['id']]);
    $order['items'] = $stmt->fetchAll();
}

jsonResponse([
    'data'        => $orders,
    'total'       => $total,
    'page'        => $page,
    'per_page'    => $perPage,
    'total_pages' => (int) ceil($total / $perPage),
]);
