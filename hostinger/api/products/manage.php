<?php
/**
 * Admin Product Management
 * POST   /api/products/manage          — Create product
 * PUT    /api/products/manage?id={id}  — Update product
 * DELETE /api/products/manage?id={id}  — Delete product
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── CREATE ──
if ($method === 'POST') {
    $body = getJsonBody();
    $id = generateUUID();
    
    $stmt = $pdo->prepare(
        "INSERT INTO products (id, name, name_bn, slug, description, description_bn, price, compare_at_price, 
         cost_price, sku, stock, category_id, collection_id, images, is_active, is_featured, display_order,
         weight, material, dimensions, care_instructions, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $id,
        $body['name'] ?? '',
        $body['name_bn'] ?? null,
        $body['slug'] ?? strtolower(str_replace(' ', '-', $body['name'] ?? '')),
        $body['description'] ?? null,
        $body['description_bn'] ?? null,
        $body['price'] ?? 0,
        $body['compare_at_price'] ?? null,
        $body['cost_price'] ?? null,
        $body['sku'] ?? null,
        $body['stock'] ?? 0,
        $body['category_id'] ?? null,
        $body['collection_id'] ?? null,
        json_encode($body['images'] ?? []),
        $body['is_active'] ?? 1,
        $body['is_featured'] ?? 0,
        $body['display_order'] ?? 0,
        $body['weight'] ?? null,
        $body['material'] ?? null,
        $body['dimensions'] ?? null,
        $body['care_instructions'] ?? null,
        json_encode($body['tags'] ?? []),
    ]);

    jsonResponse(['id' => $id, 'message' => 'Product created'], 201);
}

// ── UPDATE ──
if ($method === 'PUT') {
    $id = $_GET['id'] ?? $_REQUEST['_route_param'] ?? null;
    if (!$id) jsonError('Product ID required');

    $body = getJsonBody();
    $fields = [];
    $params = [];

    $updatable = ['name', 'name_bn', 'slug', 'description', 'description_bn', 'price', 
                  'compare_at_price', 'cost_price', 'sku', 'stock', 'category_id', 
                  'collection_id', 'is_active', 'is_featured', 'display_order',
                  'weight', 'material', 'dimensions', 'care_instructions'];

    foreach ($updatable as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = "`{$field}` = ?";
            $params[] = $body[$field];
        }
    }

    if (isset($body['images'])) {
        $fields[] = "`images` = ?";
        $params[] = json_encode($body['images']);
    }
    if (isset($body['tags'])) {
        $fields[] = "`tags` = ?";
        $params[] = json_encode($body['tags']);
    }

    if (empty($fields)) jsonError('No fields to update');

    $params[] = $id;
    $pdo->prepare("UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

    jsonSuccess('Product updated');
}

// ── DELETE ──
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? $_REQUEST['_route_param'] ?? null;
    if (!$id) jsonError('Product ID required');

    $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
    jsonSuccess('Product deleted');
}

jsonError('Method not allowed', 405);
