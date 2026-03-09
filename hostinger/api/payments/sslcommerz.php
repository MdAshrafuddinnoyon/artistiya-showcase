<?php
/** Payment: SSLCommerz */
require_once __DIR__ . '/../middleware.php';
$config = getConfig('payment');
$ssl = $config['gateways']['sslcommerz'] ?? [];
if (!($ssl['enabled'] ?? false)) jsonError('SSLCommerz is not enabled');
jsonError('SSLCommerz integration: Configure credentials in config/payment.php', 501);
