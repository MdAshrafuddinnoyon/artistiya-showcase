<?php
/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonError('Email and password are required');
}

$pdo = getDB();

// Find user
$stmt = $pdo->prepare("SELECT id, email, password_hash, email_verified_at, raw_user_meta_data FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonError('Invalid login credentials', 401);
}

if (!$user['email_verified_at']) {
    jsonError('Email not verified. Please check your inbox.', 403);
}

// Get user roles
$stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
$stmt->execute([$user['id']]);
$roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Get profile
$stmt = $pdo->prepare("SELECT full_name, phone, avatar_url FROM profiles WHERE user_id = ?");
$stmt->execute([$user['id']]);
$profile = $stmt->fetch() ?: [];

// Generate JWT
$token = generateJWT([
    'user_id' => $user['id'],
    'email'   => $user['email'],
    'roles'   => $roles,
]);

jsonResponse([
    'token'   => $token,
    'user'    => [
        'id'        => $user['id'],
        'email'     => $user['email'],
        'full_name' => $profile['full_name'] ?? null,
        'phone'     => $profile['phone'] ?? null,
        'avatar_url' => $profile['avatar_url'] ?? null,
        'roles'     => $roles,
        'is_admin'  => in_array('admin', $roles),
    ],
]);
