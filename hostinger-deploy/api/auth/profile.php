<?php
/**
 * GET  /api/auth/profile — Get current user profile
 * PUT  /api/auth/profile — Update profile
 */

require_once __DIR__ . '/../middleware.php';

$user = requireAuth();
$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT p.full_name, p.phone, p.avatar_url, p.email, u.email_verified_at
         FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id = ?"
    );
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch();

    // Get roles
    $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get addresses
    $stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
    $stmt->execute([$user['user_id']]);
    $addresses = $stmt->fetchAll();

    jsonResponse([
        'user' => array_merge($profile ?: [], [
            'id'       => $user['user_id'],
            'roles'    => $roles,
            'is_admin' => in_array('admin', $roles),
        ]),
        'addresses' => $addresses,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = getJsonBody();
    $fields = [];
    $params = [];

    foreach (['full_name', 'phone', 'avatar_url'] as $field) {
        if (isset($body[$field])) {
            $fields[] = "{$field} = ?";
            $params[] = $body[$field];
        }
    }

    if (empty($fields)) {
        jsonError('No fields to update');
    }

    $params[] = $user['user_id'];
    $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonSuccess('Profile updated');
}

jsonError('Method not allowed', 405);
