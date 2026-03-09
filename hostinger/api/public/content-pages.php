<?php
/** Public: Content Pages */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$pageKey = $_GET['key'] ?? $_REQUEST['_route_param'] ?? null;
if ($pageKey) {
    $stmt = $pdo->prepare("SELECT * FROM content_pages WHERE page_key = ? AND is_active = 1");
    $stmt->execute([$pageKey]);
    $page = $stmt->fetch();
    if (!$page) jsonError('Page not found', 404);
    jsonResponse($page);
}
$stmt = $pdo->query("SELECT id, page_key, title, title_bn, meta_title, is_active FROM content_pages WHERE is_active = 1");
jsonResponse(['data' => $stmt->fetchAll()]);
