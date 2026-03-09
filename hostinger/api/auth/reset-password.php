<?php
/**
 * POST /api/auth/reset-password — Request password reset or set new password
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$pdo = getDB();

// If token and new password provided → reset
if (!empty($body['token']) && !empty($body['password'])) {
    $tokenData = verifyJWT($body['token']);
    if (!$tokenData || ($tokenData['purpose'] ?? '') !== 'password_reset') {
        jsonError('Invalid or expired reset token', 401);
    }
    
    $userId = $tokenData['user_id'] ?? null;
    if (!$userId) jsonError('Invalid token');
    
    $newHash = password_hash($body['password'], PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost' => 4,
        'threads' => 3,
    ]);
    
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $userId]);
    
    jsonSuccess('Password updated successfully');
}

// Otherwise → send reset email
$email = trim($body['email'] ?? '');
if (empty($email)) jsonError('Email is required');

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

// Always return success (don't reveal if email exists)
if ($user) {
    $resetToken = generateJWT([
        'user_id' => $user['id'],
        'purpose' => 'password_reset',
    ]);
    
    // Queue email
    try {
        $stmt = $pdo->prepare("INSERT INTO email_queue (id, recipient, subject, html_body, priority) VALUES (?, ?, ?, ?, 1)");
        $appUrl = defined('APP_URL') ? APP_URL : 'https://yourdomain.com';
        $resetLink = "{$appUrl}/reset-password?token={$resetToken}";
        $stmt->execute([
            generateUUID(),
            $email,
            'Password Reset - Artistiya',
            "<p>Click the link below to reset your password:</p><p><a href='{$resetLink}'>{$resetLink}</a></p><p>This link expires in 24 hours.</p>",
        ]);
    } catch (PDOException $e) {
        // Non-critical
    }
}

jsonSuccess('If an account exists with that email, a reset link has been sent.');
