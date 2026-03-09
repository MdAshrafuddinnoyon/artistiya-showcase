<?php
/**
 * Artistiya E-Commerce — Application Bootstrap
 * Loaded by all API endpoints. Provides DB connection, helpers, and config.
 * 
 * @version 2.0.0
 * @requires PHP 8.0+
 */

// ============================================================
// ERROR HANDLING
// ============================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/storage/error.log');

// ============================================================
// LOAD ENVIRONMENT
// ============================================================
$envFile = __DIR__ . '/.env.php';
if (file_exists($envFile)) {
    require_once $envFile;
} else {
    http_response_code(500);
    die(json_encode(['error' => 'Application not configured. Run install.php first.']));
}

// ============================================================
// DATABASE CONNECTION (Singleton)
// ============================================================
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $config = require __DIR__ . '/config/database.php';
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $config['host'],
            $config['port'] ?? 3306,
            $config['database'],
            $config['charset'] ?? 'utf8mb4'
        );
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'",
        ]);
    }
    return $pdo;
}

// ============================================================
// CONFIG LOADER
// ============================================================
function getConfig(string $name): array {
    $file = __DIR__ . "/config/{$name}.php";
    if (!file_exists($file)) {
        return [];
    }
    return require $file;
}

// ============================================================
// CORS HEADERS
// ============================================================
function setCorsHeaders(): void {
    $allowedOrigins = defined('CORS_ORIGINS') ? CORS_ORIGINS : ['*'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    
    if ($allowedOrigins === ['*'] || in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// ============================================================
// JSON RESPONSE HELPERS
// ============================================================
function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonError(string $message, int $status = 400, array $extra = []): never {
    jsonResponse(array_merge(['error' => $message], $extra), $status);
}

function jsonSuccess(string $message, array $extra = []): never {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $extra));
}

// ============================================================
// INPUT HELPERS
// ============================================================
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitize(string $input): string {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function generateUUID(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// ============================================================
// PAGINATION HELPER
// ============================================================
function paginate(PDO $pdo, string $query, array $params = [], int $page = 1, int $perPage = 20): array {
    $countQuery = preg_replace('/SELECT .+? FROM/i', 'SELECT COUNT(*) as total FROM', $query);
    $countQuery = preg_replace('/ORDER BY .+$/i', '', $countQuery);
    $countQuery = preg_replace('/LIMIT .+$/i', '', $countQuery);
    
    $stmt = $pdo->prepare($countQuery);
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();
    
    $offset = ($page - 1) * $perPage;
    $query .= " LIMIT {$perPage} OFFSET {$offset}";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll();
    
    return [
        'data'        => $data,
        'total'       => $total,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => (int) ceil($total / $perPage),
    ];
}

// ============================================================
// FILE UPLOAD HELPER
// ============================================================
function handleFileUpload(string $fieldName, string $bucket = 'media'): ?string {
    if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $storageConfig = getConfig('storage');
    $bucketConfig = $storageConfig['buckets'][$bucket] ?? null;
    
    if (!$bucketConfig) {
        return null;
    }
    
    $file = $_FILES[$fieldName];
    $maxSize = $bucketConfig['max_size'] ?? (10 * 1024 * 1024);
    
    if ($file['size'] > $maxSize) {
        jsonError('File too large. Maximum: ' . ($maxSize / 1024 / 1024) . 'MB');
    }
    
    $mimeType = mime_content_type($file['tmp_name']);
    $allowedTypes = $bucketConfig['allowed_types'] ?? [];
    if (!empty($allowedTypes) && !in_array($mimeType, $allowedTypes)) {
        jsonError('File type not allowed: ' . $mimeType);
    }
    
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = generateUUID() . '.' . strtolower($ext);
    $uploadDir = __DIR__ . '/storage/' . ($bucketConfig['path'] ?? $bucket);
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }
    
    $filePath = $uploadDir . '/' . $fileName;
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        jsonError('Failed to save uploaded file');
    }
    
    return '/storage/' . ($bucketConfig['path'] ?? $bucket) . '/' . $fileName;
}

// ============================================================
// SET CORS ON EVERY REQUEST
// ============================================================
setCorsHeaders();
