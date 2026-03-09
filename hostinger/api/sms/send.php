<?php
/** SMS Send API — POST /api/sms/send */
require_once __DIR__ . '/../middleware.php';
$admin = requireAdmin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$body = getJsonBody();
$phone = $body['phone'] ?? '';
$message = $body['message'] ?? '';

if (empty($phone) || empty($message)) jsonError('phone and message are required');

$config = getConfig('sms');
$provider = $config['default_provider'] ?? '';
$settings = $config['providers'][$provider] ?? [];

if (empty($provider) || empty($settings)) {
    jsonError('SMS provider not configured');
}

// Log SMS attempt
$pdo = getDB();
$logId = generateUUID();
$pdo->prepare("INSERT INTO sms_log (id, phone, message, provider, status) VALUES (?, ?, ?, ?, 'pending')")
    ->execute([$logId, $phone, $message, $provider]);

try {
    $sent = false;
    
    switch ($provider) {
        case 'bulksmsbd':
            $ch = curl_init($settings['api_url']);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query([
                    'api_key' => $settings['api_key'],
                    'senderid' => $settings['sender_id'],
                    'number' => $phone,
                    'message' => $message,
                ]),
                CURLOPT_RETURNTRANSFER => true,
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
            $sent = $response !== false;
            break;
            
        case 'greenweb':
            $url = $settings['api_url'] . '?' . http_build_query([
                'token' => $settings['token'],
                'to' => $phone,
                'message' => $message,
            ]);
            $sent = file_get_contents($url) !== false;
            break;
            
        default:
            jsonError("SMS provider '{$provider}' handler not implemented");
    }
    
    $status = $sent ? 'sent' : 'failed';
    $pdo->prepare("UPDATE sms_log SET status = ? WHERE id = ?")->execute([$status, $logId]);
    
    if ($sent) jsonSuccess('SMS sent');
    jsonError('SMS sending failed', 500);
    
} catch (Exception $e) {
    $pdo->prepare("UPDATE sms_log SET status = 'failed', error_message = ? WHERE id = ?")
        ->execute([$e->getMessage(), $logId]);
    jsonError('SMS error: ' . $e->getMessage(), 500);
}
