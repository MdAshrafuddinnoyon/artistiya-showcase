<?php
/** Public: Testimonials */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$stmt = $pdo->query("SELECT * FROM testimonials WHERE is_active = 1 ORDER BY display_order ASC");
jsonResponse(['data' => $stmt->fetchAll()]);
