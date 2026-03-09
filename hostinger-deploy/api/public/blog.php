<?php
/** Public: Blog posts */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$slug = $_GET['slug'] ?? $_REQUEST['_route_param'] ?? null;
if ($slug) {
    $stmt = $pdo->prepare("SELECT p.*, c.name as category_name FROM blog_posts p LEFT JOIN blog_categories c ON c.id = p.category_id WHERE p.slug = ? AND p.is_published = 1");
    $stmt->execute([$slug]);
    $post = $stmt->fetch();
    if (!$post) jsonError('Post not found', 404);
    jsonResponse($post);
}
$page = max(1, intval($_GET['page'] ?? 1));
$perPage = 12;
$offset = ($page - 1) * $perPage;
$stmt = $pdo->query("SELECT p.*, c.name as category_name FROM blog_posts p LEFT JOIN blog_categories c ON c.id = p.category_id WHERE p.is_published = 1 ORDER BY p.published_at DESC LIMIT {$perPage} OFFSET {$offset}");
jsonResponse(['data' => $stmt->fetchAll()]);
