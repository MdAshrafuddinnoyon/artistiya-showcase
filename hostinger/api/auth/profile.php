<?php
/**
 * GET  /api/auth/profile — Get current user profile
 * PUT  /api/auth/profile — Update profile
 */

require_once __DIR__ . '/../middleware.php';

$user = requireAuth();
$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT p.*, u.email, u.email_verified_at FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?");
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch();
    
    if (!$profile) jsonError('Profile not found', 404);
    
    // Get roles
    $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $profile['roles'] = $roles;
    $profile['is_admin'] = in_array('admin', $roles);
    
    jsonResponse($profile);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = getJsonBody();
    
    $updatable = ['full_name', 'phone', 'avatar_url'];
    $fields = [];
    $params = [];
    
    foreach ($updatable as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = "`{$field}` = ?";
            $params[] = $body[$field];
        }
    }
    
    if (empty($fields)) jsonError('No fields to update');
    
    $params[] = $user['user_id'];
    $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE user_id = ?";
    $pdo->prepare($sql)->execute($params);
    
    jsonSuccess('Profile updated');
}

jsonError('Method not allowed', 405);
