<?php
/**
 * Artistiya E-Commerce — Authentication Middleware
 * JWT-based authentication and admin authorization.
 */

// ============================================================
// JWT FUNCTIONS
// ============================================================

function generateJWT(array $payload): string {
    $secret = defined('JWT_SECRET') ? JWT_SECRET : 'fallback-secret-change-me';
    $expiry = defined('JWT_EXPIRY') ? JWT_EXPIRY : 86400;
    
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiry;
    $payloadEncoded = base64url_encode(json_encode($payload));
    
    $signature = base64url_encode(
        hash_hmac('sha256', "{$header}.{$payloadEncoded}", $secret, true)
    );
    
    return "{$header}.{$payloadEncoded}.{$signature}";
}

function verifyJWT(string $token): ?array {
    $secret = defined('JWT_SECRET') ? JWT_SECRET : 'fallback-secret-change-me';
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    [$header, $payload, $signature] = $parts;
    
    $expectedSignature = base64url_encode(
        hash_hmac('sha256', "{$header}.{$payload}", $secret, true)
    );
    
    if (!hash_equals($expectedSignature, $signature)) return null;
    
    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return null;
    
    // Check expiry
    if (isset($data['exp']) && $data['exp'] < time()) return null;
    
    return $data;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

/**
 * Requires valid JWT token. Returns user payload or dies with 401.
 */
function requireAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        jsonError('Authentication required', 401);
    }
    
    $user = verifyJWT($token);
    if (!$user) {
        jsonError('Invalid or expired token', 401);
    }
    
    return $user;
}

/**
 * Requires admin role. Returns user payload or dies with 403.
 */
function requireAdmin(): array {
    $user = requireAuth();
    
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'");
    $stmt->execute([$user['user_id']]);
    
    if (!$stmt->fetch()) {
        jsonError('Admin access required', 403);
    }
    
    $user['is_admin'] = true;
    return $user;
}

/**
 * Optional auth — returns user payload if token present, null otherwise.
 */
function optionalAuth(): ?array {
    $token = getBearerToken();
    if (!$token) return null;
    return verifyJWT($token);
}

/**
 * Extract Bearer token from Authorization header.
 */
function getBearerToken(): ?string {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        return $matches[1];
    }
    
    return null;
}
