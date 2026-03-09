<?php
/** Payment: SurjoPay */
require_once __DIR__ . '/../middleware.php';
$config = getConfig('payment');
$sp = $config['gateways']['surjopay'] ?? [];
if (!($sp['enabled'] ?? false)) jsonError('SurjoPay is not enabled');
jsonError('SurjoPay integration: Configure credentials in config/payment.php', 501);
