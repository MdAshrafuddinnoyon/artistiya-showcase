<?php
/**
 * POST /api/auth/login — Authenticate user and return JWT token
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

// Rate limiting
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$stmt = $pdo->prepare("SELECT attempts, blocked_until FROM rate_limits WHERE identifier = ? AND action = 'login'");
$stmt->execute([$ip]);
$rateLimit = $stmt->fetch();

if ($rateLimit && $rateLimit['blocked_until'] && strtotime($rateLimit['blocked_until']) > time()) {
    $minutes = ceil((strtotime($rateLimit['blocked_until']) - time()) / 60);
    jsonError("Too many login attempts. Try again in {$minutes} minutes.", 429);
}

// Find user
$stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    // Track failed attempts
    $stmt = $pdo->prepare("INSERT INTO rate_limits (identifier, action, attempts, last_attempt_at) VALUES (?, 'login', 1, NOW())
                           ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt_at = NOW(), 
                           blocked_until = IF(attempts >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), blocked_until)");
    $stmt->execute([$ip]);
    
    jsonError('Invalid email or password', 401);
}

// Clear rate limit on success
$pdo->prepare("DELETE FROM rate_limits WHERE identifier = ? AND action = 'login'")->execute([$ip]);

// Check admin status
$stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'");
$stmt->execute([$user['id']]);
$isAdmin = (bool) $stmt->fetch();

// Get profile
$stmt = $pdo->prepare("SELECT full_name, avatar_url FROM profiles WHERE user_id = ?");
$stmt->execute([$user['id']]);
$profile = $stmt->fetch() ?: [];

// Generate JWT
$token = generateJWT([
    'user_id' => $user['id'],
    'email' => $user['email'],
    'is_admin' => $isAdmin,
]);

jsonResponse([
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'user_metadata' => [
            'full_name' => $profile['full_name'] ?? null,
            'avatar_url' => $profile['avatar_url'] ?? null,
        ],
    ],
    'token' => $token,
    'user_id' => $user['id'],
    'is_admin' => $isAdmin,
]);
