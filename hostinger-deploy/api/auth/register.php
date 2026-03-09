<?php
/**
 * POST /api/auth/register
 * Create new user account.
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$fullName = trim($body['full_name'] ?? '');

if (empty($email) || empty($password)) {
    jsonError('Email and password are required');
}

if (strlen($password) < 8) {
    jsonError('Password must be at least 8 characters');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address');
}

$pdo = getDB();

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonError('Email already registered', 409);
}

$userId = generateUUID();
$passwordHash = password_hash($password, PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost'   => 4,
    'threads'     => 3,
]);

$pdo->beginTransaction();

try {
    // Create user
    $stmt = $pdo->prepare(
        "INSERT INTO users (id, email, password_hash, email_verified_at, raw_user_meta_data) 
         VALUES (?, ?, ?, NOW(), ?)"
    );
    $stmt->execute([
        $userId,
        $email,
        $passwordHash,
        json_encode(['full_name' => $fullName]),
    ]);

    // Create profile
    $stmt = $pdo->prepare(
        "INSERT INTO profiles (id, user_id, full_name, email) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([generateUUID(), $userId, $fullName, $email]);

    // Assign customer role
    $stmt = $pdo->prepare(
        "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'customer')"
    );
    $stmt->execute([generateUUID(), $userId]);

    $pdo->commit();

    // Generate JWT
    $token = generateJWT([
        'user_id' => $userId,
        'email'   => $email,
        'roles'   => ['customer'],
    ]);

    jsonResponse([
        'token' => $token,
        'user'  => [
            'id'        => $userId,
            'email'     => $email,
            'full_name' => $fullName,
            'roles'     => ['customer'],
            'is_admin'  => false,
        ],
    ], 201);
} catch (Exception $e) {
    $pdo->rollBack();
    jsonError('Registration failed: ' . $e->getMessage(), 500);
}
