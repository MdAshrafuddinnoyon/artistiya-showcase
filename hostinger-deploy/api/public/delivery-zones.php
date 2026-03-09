<?php
/** Public: Delivery Zones */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$stmt = $pdo->query("SELECT * FROM delivery_zones WHERE is_active = 1 ORDER BY division, district");
jsonResponse(['data' => $stmt->fetchAll()]);
