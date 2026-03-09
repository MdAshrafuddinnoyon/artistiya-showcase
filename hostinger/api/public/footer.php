<?php
/** Public: Footer data */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$groups = $pdo->query("SELECT * FROM footer_link_groups WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
foreach ($groups as &$g) {
    $stmt = $pdo->prepare("SELECT * FROM footer_links WHERE group_id = ? AND is_active = 1 ORDER BY display_order ASC");
    $stmt->execute([$g['id']]);
    $g['links'] = $stmt->fetchAll();
}
$banners = $pdo->query("SELECT * FROM footer_payment_banners WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
$social = $pdo->query("SELECT * FROM social_links WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
jsonResponse(['link_groups' => $groups, 'payment_banners' => $banners, 'social_links' => $social]);
