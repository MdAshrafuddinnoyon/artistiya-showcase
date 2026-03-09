<?php
/**
 * Admin Category Management
 * POST/PUT/DELETE /api/categories/manage
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = getJsonBody();
    $id = generateUUID();
    $stmt = $pdo->prepare(
        "INSERT INTO categories (id, name, name_bn, slug, description, image_url, mobile_image_url, 
         icon_name, icon_emoji, parent_id, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $id, $body['name'] ?? '', $body['name_bn'] ?? null,
        $body['slug'] ?? strtolower(str_replace(' ', '-', $body['name'] ?? '')),
        $body['description'] ?? null, $body['image_url'] ?? null, $body['mobile_image_url'] ?? null,
        $body['icon_name'] ?? null, $body['icon_emoji'] ?? null, $body['parent_id'] ?? null,
        $body['display_order'] ?? 0,
    ]);
    jsonResponse(['id' => $id, 'message' => 'Category created'], 201);
}

if ($method === 'PUT') {
    $body = getJsonBody();
    $id = $body['id'] ?? $_GET['id'] ?? null;
    if (!$id) jsonError('Category ID required');

    $fields = [];
    $params = [];
    foreach (['name','name_bn','slug','description','image_url','mobile_image_url','icon_name','icon_emoji','parent_id','display_order'] as $f) {
        if (array_key_exists($f, $body)) { $fields[] = "`{$f}` = ?"; $params[] = $body[$f]; }
    }
    if (empty($fields)) jsonError('No fields to update');
    $params[] = $id;
    $pdo->prepare("UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    jsonSuccess('Category updated');
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? $_REQUEST['_route_param'] ?? null;
    if (!$id) jsonError('Category ID required');
    $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
    jsonSuccess('Category deleted');
}

jsonError('Method not allowed', 405);
