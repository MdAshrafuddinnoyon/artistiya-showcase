<?php
/**
 * PUT /api/orders/manage — Update order status (admin only)
 */

require_once __DIR__ . '/../middleware.php';

$admin = requireAdmin();
$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();
$orderId = $body['order_id'] ?? $_GET['id'] ?? null;

if (!$orderId) jsonError('Order ID required');

$fields = [];
$params = [];

$updatable = ['status', 'payment_status', 'tracking_number', 'delivery_partner_id', 
              'admin_notes', 'is_flagged'];

foreach ($updatable as $field) {
    if (array_key_exists($field, $body)) {
        $fields[] = "`{$field}` = ?";
        $params[] = $body[$field];
    }
}

if (empty($fields)) jsonError('No fields to update');

$params[] = $orderId;
$pdo->prepare("UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

jsonSuccess('Order updated');
