<?php
/**
 * File Upload Handler
 * POST /api/upload?bucket=product-images
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$user = requireAuth();
$bucket = $_GET['bucket'] ?? 'media';

$url = handleFileUpload('file', $bucket);

if (!$url) {
    jsonError('No file uploaded or upload failed');
}

// Construct full URL
$baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');

jsonResponse([
    'url'      => $baseUrl . $url,
    'path'     => $url,
    'bucket'   => $bucket,
    'uploaded' => true,
]);
