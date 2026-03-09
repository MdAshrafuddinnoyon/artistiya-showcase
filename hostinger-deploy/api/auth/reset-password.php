<?php
/**
 * POST /api/auth/reset-password
 * Reset user password (requires current password or admin token).
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$email = trim($body['email'] ?? '');
$currentPassword = $body['current_password'] ?? '';
$newPassword = $body['new_password'] ?? '';

if (empty($newPassword) || strlen($newPassword) < 8) {
    jsonError('New password must be at least 8 characters');
}

$pdo = getDB();

// If user is authenticated, allow password change with current password
$authUser = optionalAuth();

if ($authUser) {
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$authUser['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        jsonError('Current password is incorrect', 401);
    }

    $newHash = password_hash($newPassword, PASSWORD_ARGON2ID);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $authUser['user_id']]);

    jsonSuccess('Password updated successfully');
}

// Without auth, just acknowledge (don't reveal if email exists)
if (!empty($email)) {
    // In production: send reset email with token
    jsonSuccess('If an account with that email exists, a reset link has been sent.');
}

jsonError('Email or authentication required');
