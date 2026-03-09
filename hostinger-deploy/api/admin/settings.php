<?php
/**
 * GET/PUT /api/admin/settings — Admin settings management
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();

// ── GET: Fetch all settings ──
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $section = $_GET['section'] ?? 'all';
    $result = [];

    $tables = [
        'site_branding'    => 'site_branding',
        'checkout'         => 'checkout_settings',
        'email'            => 'email_settings',
        'invoice'          => 'invoice_settings',
        'customization'    => 'customization_settings',
        'fraud'            => 'checkout_fraud_settings',
        'sms'              => 'sms_settings',
    ];

    if ($section === 'all') {
        foreach ($tables as $key => $table) {
            try {
                $stmt = $pdo->query("SELECT * FROM `{$table}` LIMIT 1");
                $result[$key] = $stmt->fetch() ?: null;
            } catch (Exception $e) {
                $result[$key] = null;
            }
        }
    } elseif (isset($tables[$section])) {
        $stmt = $pdo->query("SELECT * FROM `{$tables[$section]}` LIMIT 1");
        $result = $stmt->fetch() ?: [];
    }

    jsonResponse($result);
}

// ── PUT: Update settings ──
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = getJsonBody();
    $section = $body['section'] ?? $_GET['section'] ?? null;
    $data = $body['data'] ?? $body;

    if (!$section) jsonError('Section parameter required');

    $tables = [
        'site_branding'    => 'site_branding',
        'checkout'         => 'checkout_settings',
        'email'            => 'email_settings',
        'invoice'          => 'invoice_settings',
        'customization'    => 'customization_settings',
        'fraud'            => 'checkout_fraud_settings',
    ];

    if (!isset($tables[$section])) {
        jsonError('Invalid settings section');
    }

    $table = $tables[$section];

    // Get existing record
    $existing = $pdo->query("SELECT id FROM `{$table}` LIMIT 1")->fetch();

    if ($existing) {
        $fields = [];
        $params = [];
        unset($data['section'], $data['id'], $data['created_at']);
        
        foreach ($data as $key => $value) {
            $fields[] = "`{$key}` = ?";
            $params[] = is_array($value) ? json_encode($value) : $value;
        }
        
        if (!empty($fields)) {
            $params[] = $existing['id'];
            $pdo->prepare("UPDATE `{$table}` SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }
    }

    jsonSuccess('Settings updated');
}

jsonError('Method not allowed', 405);
