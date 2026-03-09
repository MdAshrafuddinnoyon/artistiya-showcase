<?php
/** Public: Homepage sections & content */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$sections = $pdo->query("SELECT * FROM homepage_sections WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
$content = $pdo->query("SELECT * FROM homepage_content WHERE is_active = 1 ORDER BY display_order ASC")->fetchAll();
jsonResponse(['sections' => $sections, 'content' => $content]);
