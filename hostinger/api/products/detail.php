<?php
/**
 * Product Detail — GET /api/products/{id}
 * Redirected from router when ID detected in URL.
 */

require_once __DIR__ . '/../middleware.php';

$id = $_REQUEST['_route_param'] ?? null;
if (!$id) jsonError('Product ID required', 400);

$pdo = getDB();

// By ID or slug
$stmt = $pdo->prepare(
    "SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? OR p.slug = ?
     LIMIT 1"
);
$stmt->execute([$id, $id]);
$product = $stmt->fetch();

if (!$product) {
    jsonError('Product not found', 404);
}

// Variants
$stmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY display_order");
$stmt->execute([$product['id']]);
$product['variants'] = $stmt->fetchAll();

// Approved reviews
$stmt = $pdo->prepare(
    "SELECT * FROM product_reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 20"
);
$stmt->execute([$product['id']]);
$product['reviews'] = $stmt->fetchAll();

// Related products (same category)
if ($product['category_id']) {
    $stmt = $pdo->prepare(
        "SELECT id, name, slug, price, compare_at_price, images, is_featured
         FROM products
         WHERE category_id = ? AND id != ? AND is_active = 1
         ORDER BY RAND() LIMIT 8"
    );
    $stmt->execute([$product['category_id'], $product['id']]);
    $product['related_products'] = $stmt->fetchAll();
}

jsonResponse($product);
