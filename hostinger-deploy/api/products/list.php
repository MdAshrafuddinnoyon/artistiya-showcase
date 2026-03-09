<?php
/**
 * GET /api/products — List products (with filters, pagination)
 * GET /api/products/{id} — Product detail
 */

require_once __DIR__ . '/../middleware.php';

$pdo = getDB();
$id = $_REQUEST['_route_param'] ?? null;

// ── Single Product Detail ──
if ($id && preg_match('/^[0-9a-f\-]{36}$/i', $id)) {
    $stmt = $pdo->prepare(
        "SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.id = ?"
    );
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        jsonError('Product not found', 404);
    }

    // Get variants
    $stmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY display_order");
    $stmt->execute([$id]);
    $product['variants'] = $stmt->fetchAll();

    // Get reviews
    $stmt = $pdo->prepare(
        "SELECT * FROM product_reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 20"
    );
    $stmt->execute([$id]);
    $product['reviews'] = $stmt->fetchAll();

    jsonResponse($product);
}

// ── Product List ──
$page = max(1, intval($_GET['page'] ?? 1));
$perPage = min(100, max(1, intval($_GET['per_page'] ?? 20)));
$category = $_GET['category'] ?? null;
$search = $_GET['search'] ?? null;
$sort = $_GET['sort'] ?? 'created_at';
$order = strtoupper($_GET['order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$featured = $_GET['featured'] ?? null;
$collection = $_GET['collection'] ?? null;

$where = ["p.is_active = 1"];
$params = [];

if ($category) {
    $where[] = "(c.slug = ? OR c.id = ?)";
    $params[] = $category;
    $params[] = $category;
}

if ($search) {
    $where[] = "(p.name LIKE ? OR p.name_bn LIKE ? OR p.description LIKE ?)";
    $searchTerm = "%{$search}%";
    $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
}

if ($featured === '1' || $featured === 'true') {
    $where[] = "p.is_featured = 1";
}

if ($collection) {
    $where[] = "p.collection_id = ?";
    $params[] = $collection;
}

$allowedSorts = ['created_at', 'price', 'name', 'display_order'];
if (!in_array($sort, $allowedSorts)) $sort = 'created_at';

$whereSQL = implode(' AND ', $where);

// Count total
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE {$whereSQL}");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

// Fetch page
$offset = ($page - 1) * $perPage;
$stmt = $pdo->prepare(
    "SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE {$whereSQL}
     ORDER BY p.{$sort} {$order}
     LIMIT {$perPage} OFFSET {$offset}"
);
$stmt->execute($params);
$products = $stmt->fetchAll();

jsonResponse([
    'data'        => $products,
    'total'       => $total,
    'page'        => $page,
    'per_page'    => $perPage,
    'total_pages' => (int) ceil($total / $perPage),
]);
