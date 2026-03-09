<?php
/**
 * GET /api/auth/session — Check current session
 * Returns user data if token is valid.
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$user = optionalAuth();

if (!$user) {
    jsonResponse(['session' => null]);
}

$pdo = getDB();

// Get full profile
$stmt = $pdo->prepare("SELECT p.*, u.email, u.email_verified_at FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?");
$stmt->execute([$user['user_id']]);
$profile = $stmt->fetch();

// Check admin
$stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
$stmt->execute([$user['user_id']]);
$roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

jsonResponse([
    'session' => [
        'user' => [
            'id' => $user['user_id'],
            'email' => $profile['email'] ?? $user['email'] ?? null,
            'user_metadata' => [
                'full_name' => $profile['full_name'] ?? null,
                'avatar_url' => $profile['avatar_url'] ?? null,
            ],
            'roles' => $roles,
            'is_admin' => in_array('admin', $roles),
        ],
    ],
]);
