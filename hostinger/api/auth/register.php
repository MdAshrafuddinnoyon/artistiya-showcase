<?php
/**
 * POST /api/auth/register (or /api/auth/signup)
 * Create new user account with JWT authentication.
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$fullName = trim($body['full_name'] ?? $body['fullName'] ?? '');

// Validation
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Valid email is required');
}
if (strlen($password) < 6) {
    jsonError('Password must be at least 6 characters');
}

$pdo = getDB();

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonError('An account with this email already exists');
}

// Create user
$userId = generateUUID();
$passwordHash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost' => 4,
    'threads' => 3,
]);

$metadata = json_encode(['full_name' => $fullName]);

$pdo->beginTransaction();

try {
    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash, email_verified_at, raw_user_meta_data) VALUES (?, ?, ?, NOW(), ?)");
    $stmt->execute([$userId, $email, $passwordHash, $metadata]);
    
    // Profile is auto-created by trigger, but ensure it exists
    $stmt = $pdo->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO profiles (id, user_id, full_name, email) VALUES (?, ?, ?, ?)");
        $stmt->execute([generateUUID(), $userId, $fullName, $email]);
    }
    
    // Assign default customer role
    $stmt = $pdo->prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'customer')");
    $stmt->execute([generateUUID(), $userId]);
    
    $pdo->commit();
    
    // Generate JWT
    $token = generateJWT([
        'user_id' => $userId,
        'email' => $email,
    ]);
    
    jsonResponse([
        'user' => [
            'id' => $userId,
            'email' => $email,
            'user_metadata' => ['full_name' => $fullName],
        ],
        'token' => $token,
        'user_id' => $userId,
    ], 201);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    jsonError('Registration failed. Please try again.');
}
