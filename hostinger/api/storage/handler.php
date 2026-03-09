<?php
/**
 * Storage Handler — Replaces Supabase Storage
 * 
 * Routes:
 *   POST   /api/storage/{bucket}/upload  → Upload file
 *   POST   /api/storage/{bucket}/delete  → Delete files
 *   GET    /api/storage/{bucket}/{path}  → Serve file (public URL)
 */

require_once __DIR__ . '/../middleware.php';

$bucket = $_GET['bucket'] ?? '';
$action = $_GET['action'] ?? '';

$allowedBuckets = ['product-images', 'custom-designs', 'media', 'testimonials'];

if (!in_array($bucket, $allowedBuckets)) {
    jsonError('Invalid storage bucket: ' . $bucket, 400);
}

$bucketDir = str_replace('-', '_', $bucket);
$storageBase = __DIR__ . '/../../storage/' . $bucketDir;

if (!is_dir($storageBase)) {
    mkdir($storageBase, 0775, true);
}

if ($action === 'upload') {
    // ── Upload ──────────────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No file uploaded or upload error');
    }
    
    $file = $_FILES['file'];
    $maxSize = 20 * 1024 * 1024; // 20MB
    
    if ($file['size'] > $maxSize) {
        jsonError('File too large. Maximum: 20MB');
    }
    
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    $mimeType = mime_content_type($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        jsonError('File type not allowed: ' . $mimeType);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $path = $_POST['path'] ?? (generateUUID() . '.' . strtolower($ext));
    
    // Create subdirectories if path contains /
    $fullPath = $storageBase . '/' . $path;
    $dir = dirname($fullPath);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    
    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        jsonError('Failed to save file');
    }
    
    $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $publicUrl = $baseUrl . '/storage/' . $bucketDir . '/' . $path;
    
    // Log to storage_objects table
    $pdo = getDB();
    try {
        $stmt = $pdo->prepare("INSERT INTO storage_objects (bucket, name, size, mime_type, url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$bucket, $path, $file['size'], $mimeType, $publicUrl, $user['user_id']]);
    } catch (PDOException $e) {
        // Non-critical, continue
    }
    
    jsonResponse([
        'data' => [
            'path' => $path,
            'fullPath' => $bucketDir . '/' . $path,
        ],
        'url' => $publicUrl,
    ]);
    
} elseif ($action === 'delete') {
    // ── Delete ──────────────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonError('Method not allowed', 405);
    }
    
    $user = requireAuth();
    $body = getJsonBody();
    $paths = $body['paths'] ?? [];
    
    $deleted = 0;
    foreach ($paths as $path) {
        $fullPath = $storageBase . '/' . basename($path);
        if (file_exists($fullPath)) {
            @unlink($fullPath);
            $deleted++;
        }
    }
    
    // Clean up storage_objects
    $pdo = getDB();
    foreach ($paths as $path) {
        try {
            $pdo->prepare("DELETE FROM storage_objects WHERE bucket = ? AND name = ?")->execute([$bucket, $path]);
        } catch (PDOException $e) {
            // Non-critical
        }
    }
    
    jsonResponse(['deleted' => $deleted]);
    
} else {
    // ── Serve File (public) ─────────────────────────────────
    $filePath = $storageBase . '/' . $action;
    
    if (!file_exists($filePath)) {
        jsonError('File not found', 404);
    }
    
    $mimeType = mime_content_type($filePath);
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, max-age=31536000');
    readfile($filePath);
    exit;
}
