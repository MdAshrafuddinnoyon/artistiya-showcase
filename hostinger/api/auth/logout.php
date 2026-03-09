<?php
/**
 * POST /api/auth/logout — Invalidate session
 */

require_once __DIR__ . '/../middleware.php';

// JWT tokens are stateless; logout is client-side (remove token)
// For enhanced security, you could maintain a blacklist table

jsonSuccess('Logged out successfully');
