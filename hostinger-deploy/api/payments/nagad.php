<?php
/** Payment: Nagad */
require_once __DIR__ . '/../middleware.php';
$config = getConfig('payment');
$nagad = $config['gateways']['nagad'] ?? [];
if (!($nagad['enabled'] ?? false)) jsonError('Nagad is not enabled');
jsonError('Nagad integration: Configure credentials in config/payment.php', 501);
