<?php
/** Payment: aamarPay */
require_once __DIR__ . '/../middleware.php';
$config = getConfig('payment');
$ap = $config['gateways']['aamarpay'] ?? [];
if (!($ap['enabled'] ?? false)) jsonError('aamarPay is not enabled');
jsonError('aamarPay integration: Configure credentials in config/payment.php', 501);
