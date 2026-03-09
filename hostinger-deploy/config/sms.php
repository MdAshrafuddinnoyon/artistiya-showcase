<?php
/**
 * Artistiya E-Commerce — SMS Configuration
 * Multi-provider SMS gateway for OTP, order updates, and notifications
 * 
 * Supported: Twilio, BulkSMSBD, GreenWeb, SMSQ, Infobip, Nexmo/Vonage, Custom HTTP
 */

return [
    // Default provider
    'default_provider' => 'twilio',

    'providers' => [
        'twilio' => [
            'account_sid' => '',
            'auth_token'  => '',
            'from_number' => '',
            'api_url'     => 'https://api.twilio.com/2010-04-01',
        ],

        'bulksmsbd' => [
            'api_key'   => '',
            'sender_id' => '',
            'api_url'   => 'https://bulksmsbd.net/api/smsapi',
        ],

        'greenweb' => [
            'token'     => '',
            'api_url'   => 'http://api.greenweb.com.bd/api.php',
        ],

        'smsq' => [
            'api_key'   => '',
            'sender_id' => '',
            'api_url'   => 'https://api.smsq.global/api/v2/SendSMS',
        ],

        'infobip' => [
            'api_key'   => '',
            'base_url'  => '',
            'sender_id' => 'Artistiya',
        ],

        'nexmo' => [
            'api_key'    => '',
            'api_secret' => '',
            'from'       => 'Artistiya',
        ],

        'custom' => [
            'api_url'    => '',
            'api_key'    => '',
            'method'     => 'POST',
            'headers'    => [],
            'body_template' => '{"to":"{{phone}}","message":"{{message}}"}',
        ],
    ],

    // Notification toggles
    'notifications' => [
        'order_confirmation'    => true,
        'shipping_update'       => true,
        'delivery_notification' => true,
        'otp_verification'      => true,
    ],

    // OTP settings
    'otp' => [
        'length'       => 6,
        'expiry'       => 300,     // 5 minutes
        'max_attempts' => 3,
        'cooldown'     => 60,      // 1 minute between OTPs
        'hash_algo'    => 'sha256',
    ],
];
