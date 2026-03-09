<?php
/**
 * POST /api/orders/create — Create new order
 */

require_once __DIR__ . '/../middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$user = requireAuth();
$pdo = getDB();
$body = getJsonBody();

$addressId = $body['address_id'] ?? null;
$items = $body['items'] ?? [];
$paymentMethod = $body['payment_method'] ?? 'cod';
$promoCode = $body['promo_code'] ?? null;
$orderNotes = $body['order_notes'] ?? null;
$giftMessage = $body['gift_message'] ?? null;

if (empty($items)) {
    jsonError('Order must contain at least one item');
}

if (!$addressId) {
    jsonError('Delivery address is required');
}

$pdo->beginTransaction();

try {
    $orderId = generateUUID();
    $subtotal = 0;

    // Validate items and calculate total
    $orderItems = [];
    foreach ($items as $item) {
        $stmt = $pdo->prepare("SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1");
        $stmt->execute([$item['product_id']]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new Exception("Product not found: {$item['product_id']}");
        }

        $qty = max(1, intval($item['quantity'] ?? 1));
        if ($product['stock'] !== null && $product['stock'] < $qty) {
            throw new Exception("Insufficient stock for: {$product['name']}");
        }

        $lineTotal = $product['price'] * $qty;
        $subtotal += $lineTotal;

        $orderItems[] = [
            'product_id'   => $product['id'],
            'product_name' => $product['name'],
            'price'        => $product['price'],
            'quantity'     => $qty,
            'total'        => $lineTotal,
        ];

        // Reduce stock
        if ($product['stock'] !== null) {
            $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?")->execute([$qty, $product['id']]);
        }
    }

    // Calculate shipping
    $checkoutSettings = $pdo->query("SELECT * FROM checkout_settings LIMIT 1")->fetch();
    $shippingCost = $checkoutSettings['default_shipping_cost'] ?? 120;
    $freeThreshold = $checkoutSettings['free_shipping_threshold'] ?? null;
    if ($freeThreshold && $subtotal >= $freeThreshold) {
        $shippingCost = 0;
    }

    // Apply promo code
    $discount = 0;
    if ($promoCode) {
        $stmt = $pdo->prepare(
            "SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)"
        );
        $stmt->execute([$promoCode]);
        $promo = $stmt->fetch();
        if ($promo) {
            if ($promo['discount_type'] === 'percentage') {
                $discount = $subtotal * ($promo['discount_value'] / 100);
                if ($promo['max_discount']) $discount = min($discount, $promo['max_discount']);
            } else {
                $discount = $promo['discount_value'];
            }
            $pdo->prepare("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?")->execute([$promo['id']]);
        }
    }

    $codCharge = ($paymentMethod === 'cod') ? ($checkoutSettings['cod_extra_charge'] ?? 0) : 0;
    $total = $subtotal - $discount + $shippingCost + $codCharge;

    // Create order
    $stmt = $pdo->prepare(
        "INSERT INTO orders (id, user_id, address_id, subtotal, shipping_cost, discount, cod_charge, total, 
         payment_method, promo_code_id, order_notes, gift_message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([
        $orderId, $user['user_id'], $addressId, $subtotal, $shippingCost, $discount, $codCharge,
        $total, $paymentMethod, $promo['id'] ?? null, $orderNotes, $giftMessage,
    ]);

    // Insert order items
    foreach ($orderItems as $oi) {
        $stmt = $pdo->prepare(
            "INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, total)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            generateUUID(), $orderId, $oi['product_id'], $oi['product_name'],
            $oi['price'], $oi['quantity'], $oi['total'],
        ]);
    }

    // Clear cart
    $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?")->execute([$user['user_id']]);

    $pdo->commit();

    // Get order number
    $stmt = $pdo->prepare("SELECT order_number FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $orderNumber = $stmt->fetchColumn();

    jsonResponse([
        'order_id'     => $orderId,
        'order_number' => $orderNumber,
        'total'        => $total,
        'status'       => 'pending',
        'message'      => 'Order placed successfully',
    ], 201);
} catch (Exception $e) {
    $pdo->rollBack();
    jsonError($e->getMessage(), 400);
}
