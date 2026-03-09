<?php
/** Public: FAQ */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$pageType = $_GET['page_type'] ?? null;
$where = "WHERE is_active = 1";
$params = [];
if ($pageType) { $where .= " AND page_type = ?"; $params[] = $pageType; }
$stmt = $pdo->prepare("SELECT * FROM faq_items {$where} ORDER BY display_order ASC");
$stmt->execute($params);
jsonResponse(['data' => $stmt->fetchAll()]);
