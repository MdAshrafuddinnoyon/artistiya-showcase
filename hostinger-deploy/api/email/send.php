<?php
/** Email Send API — POST /api/email/send */
require_once __DIR__ . '/../middleware.php';
$admin = requireAdmin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$body = getJsonBody();
$to = $body['to'] ?? '';
$subject = $body['subject'] ?? '';
$htmlContent = $body['html'] ?? $body['body'] ?? '';
$templateKey = $body['template_key'] ?? null;

if (empty($to) || empty($subject)) jsonError('to and subject are required');

$config = getConfig('email');
$provider = $config['default_provider'] ?? 'smtp';
$settings = $config['providers'][$provider] ?? [];

// If template_key, load from DB
if ($templateKey) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM email_templates WHERE template_key = ? AND is_active = 1");
    $stmt->execute([$templateKey]);
    $template = $stmt->fetch();
    if ($template) {
        $subject = $template['subject'];
        $htmlContent = $template['html_content'];
        // Replace placeholders
        foreach ($body['variables'] ?? [] as $key => $val) {
            $htmlContent = str_replace("{{" . $key . "}}", $val, $htmlContent);
            $subject = str_replace("{{" . $key . "}}", $val, $subject);
        }
    }
}

if ($provider === 'smtp') {
    // Use PHP mail() or PHPMailer if available
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . ($settings['from_name'] ?? 'Artistiya') . ' <' . ($settings['from_email'] ?? $settings['username'] ?? '') . '>',
    ];
    
    $sent = @mail($to, $subject, $htmlContent, implode("\r\n", $headers));
    
    if ($sent) {
        jsonSuccess('Email sent successfully');
    } else {
        jsonError('Failed to send email. Check SMTP configuration.', 500);
    }
}

jsonError("Email provider '{$provider}' not fully configured", 500);
