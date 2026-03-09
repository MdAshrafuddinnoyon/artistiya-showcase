<?php
/** Public: Gallery */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$albums = $pdo->query("SELECT * FROM gallery_albums WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
foreach ($albums as &$a) {
    $stmt = $pdo->prepare("SELECT * FROM gallery_items WHERE album_id = ? AND is_active = 1 ORDER BY display_order ASC");
    $stmt->execute([$a['id']]);
    $a['items'] = $stmt->fetchAll();
}
jsonResponse(['data' => $albums]);
