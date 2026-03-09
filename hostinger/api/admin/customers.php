<?php
/**
 * GET /api/admin/customers — List customers (admin only)
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();

$page = max(1, intval($_GET['page'] ?? 1));
$perPage = min(100, max(1, intval($_GET['per_page'] ?? 20)));
$search = $_GET['search'] ?? null;

$where = [];
$params = [];

if ($search) {
    $where[] = "(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    $s = "%{$search}%";
    $params = [$s, $s, $s];
}

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$total = (int) $pdo->prepare("SELECT COUNT(*) FROM customers {$whereSQL}")->execute($params) ? 
    $pdo->query("SELECT FOUND_ROWS()")->fetchColumn() : 0;

// Re-count properly
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM customers {$whereSQL}");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$offset = ($page - 1) * $perPage;
$stmt = $pdo->prepare("SELECT * FROM customers {$whereSQL} ORDER BY created_at DESC LIMIT {$perPage} OFFSET {$offset}");
$stmt->execute($params);

jsonResponse([
    'data'        => $stmt->fetchAll(),
    'total'       => $total,
    'page'        => $page,
    'per_page'    => $perPage,
    'total_pages' => (int) ceil($total / max(1, $perPage)),
]);
