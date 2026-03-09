<?php
/** Public: Menu Items */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$items = $pdo->query("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
foreach ($items as &$item) {
    $stmt = $pdo->prepare("SELECT * FROM menu_sub_items WHERE menu_item_id = ? AND is_active = 1 ORDER BY display_order ASC");
    $stmt->execute([$item['id']]);
    $item['sub_items'] = $stmt->fetchAll();
}
jsonResponse(['data' => $items]);
