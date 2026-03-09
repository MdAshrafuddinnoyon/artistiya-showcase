<?php
/** Public: Product Reviews */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$productId = $_GET['product_id'] ?? null;
if (!$productId) jsonError('product_id required');
$stmt = $pdo->prepare("SELECT * FROM product_reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC");
$stmt->execute([$productId]);
jsonResponse(['data' => $stmt->fetchAll()]);
