<?php
/**
 * Artistiya E-Commerce — Email Configuration (PHPMailer)
 * Supports: Hostinger SMTP, Resend API, SendGrid, Mailgun
 * 
 * For Hostinger: Go to hPanel → Emails → Connect Apps & Devices
 * Host: smtp.hostinger.com, Port: 465 (SSL) or 587 (TLS)
 */

return [
    // Default provider: smtp | resend | sendgrid | mailgun
    'default_provider' => 'smtp',

    'providers' => [
        'smtp' => [
            'host'       => 'smtp.hostinger.com',
            'port'       => 465,
            'encryption' => 'ssl',       // ssl | tls
            'username'   => '',           // Your full email address
            'password'   => '',           // Email password
            'from_email' => '',
            'from_name'  => 'Artistiya',
            'reply_to'   => '',
            'auth'       => true,
        ],

        'resend' => [
            'api_key'    => '',           // re_xxxxxxxxxxxxx
            'from_email' => 'onboarding@resend.dev',
            'from_name'  => 'Artistiya',
        ],

        'sendgrid' => [
            'api_key'    => '',           // SG.xxxxxxxxxxxxx
            'from_email' => '',
            'from_name'  => 'Artistiya',
        ],

        'mailgun' => [
            'api_key'    => '',
            'domain'     => '',           // mg.yourdomain.com
            'from_email' => '',
            'from_name'  => 'Artistiya',
        ],
    ],

    // Notification toggles
    'notifications' => [
        'order_confirmation'    => true,
        'shipping_update'       => true,
        'delivery_notification' => true,
    ],

    // Queue settings (for PHP-based email queue)
    'queue' => [
        'enabled'       => true,
        'max_retries'   => 3,
        'retry_delay'   => 300,  // 5 minutes
        'batch_size'    => 10,
    ],

    // Template directory
    'template_dir' => __DIR__ . '/../templates/email/',
];
