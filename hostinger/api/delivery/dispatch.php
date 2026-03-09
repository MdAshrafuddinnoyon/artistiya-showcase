<?php
/** Delivery Dispatch API — POST /api/delivery/dispatch */
require_once __DIR__ . '/../middleware.php';
$admin = requireAdmin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$body = getJsonBody();
$orderId = $body['order_id'] ?? '';
$providerType = $body['provider'] ?? 'manual';

if (empty($orderId)) jsonError('order_id required');

$pdo = getDB();
$config = getConfig('delivery');
$providerConfig = $config['providers'][$providerType] ?? [];

// Get order details
$stmt = $pdo->prepare(
    "SELECT o.*, a.full_name, a.phone, a.address_line, a.district, a.division, a.thana
     FROM orders o JOIN addresses a ON a.id = o.address_id WHERE o.id = ?"
);
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) jsonError('Order not found', 404);

if ($providerType === 'manual') {
    $pdo->prepare("UPDATE orders SET status = 'shipped', tracking_number = ? WHERE id = ?")
        ->execute([$body['tracking_number'] ?? null, $orderId]);
    jsonSuccess('Order dispatched (manual)', ['tracking_number' => $body['tracking_number'] ?? null]);
}

// For API-based providers (Pathao, Steadfast, etc.)
jsonError("Provider '{$providerType}' API integration pending. Use manual dispatch.", 501);
