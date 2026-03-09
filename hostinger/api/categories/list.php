<?php
/**
 * GET /api/categories — List categories
 */

require_once __DIR__ . '/../middleware.php';

$pdo = getDB();

$stmt = $pdo->query(
    "SELECT * FROM categories ORDER BY display_order ASC, name ASC"
);
$categories = $stmt->fetchAll();

jsonResponse(['data' => $categories]);
