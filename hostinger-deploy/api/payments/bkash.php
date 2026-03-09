<?php
/** Payment: bKash */
require_once __DIR__ . '/../middleware.php';
$config = getConfig('payment');
$bkash = $config['gateways']['bkash'] ?? [];
if (!($bkash['enabled'] ?? false)) jsonError('bKash is not enabled');
// Implementation depends on bKash API version
jsonError('bKash integration: Configure credentials in config/payment.php', 501);
