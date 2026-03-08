<?php
/**
 * Artistiya E-Commerce — Payment Gateway Configuration
 * Supports: SSLCommerz, bKash, Nagad, aamarPay, SurjoPay, COD
 */

return [
    'default_method' => 'cod',
    'currency' => 'BDT',

    'gateways' => [
        'sslcommerz' => [
            'enabled'        => false,
            'sandbox'        => true,
            'store_id'       => '',
            'store_password' => '',
            'success_url'    => '/api/payments/sslcommerz/success',
            'fail_url'       => '/api/payments/sslcommerz/fail',
            'cancel_url'     => '/api/payments/sslcommerz/cancel',
            'ipn_url'        => '/api/payments/sslcommerz/ipn',
            'sandbox_url'    => 'https://sandbox.sslcommerz.com',
            'live_url'       => 'https://securepay.sslcommerz.com',
        ],

        'bkash' => [
            'enabled'       => false,
            'sandbox'       => true,
            'app_key'       => '',
            'app_secret'    => '',
            'username'      => '',
            'password'      => '',
            'sandbox_url'   => 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
            'live_url'      => 'https://tokenized.pay.bka.sh/v1.2.0-beta',
            'callback_url'  => '/api/payments/bkash/callback',
        ],

        'nagad' => [
            'enabled'       => false,
            'sandbox'       => true,
            'merchant_id'   => '',
            'merchant_key'  => '',
            'public_key'    => '',
            'private_key'   => '',
            'sandbox_url'   => 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
            'live_url'      => 'https://api.mynagad.com/api/dfs',
            'callback_url'  => '/api/payments/nagad/callback',
        ],

        'aamarpay' => [
            'enabled'       => false,
            'sandbox'       => true,
            'store_id'      => '',
            'signature_key' => '',
            'sandbox_url'   => 'https://sandbox.aamarpay.com',
            'live_url'      => 'https://secure.aamarpay.com',
            'success_url'   => '/api/payments/aamarpay/success',
            'fail_url'      => '/api/payments/aamarpay/fail',
            'cancel_url'    => '/api/payments/aamarpay/cancel',
        ],

        'surjopay' => [
            'enabled'       => false,
            'sandbox'       => true,
            'merchant_id'   => '',
            'merchant_key'  => '',
            'sandbox_url'   => 'https://sandbox.surjopay.com',
            'live_url'      => 'https://engine.surjopay.com',
            'callback_url'  => '/api/payments/surjopay/callback',
        ],

        'cod' => [
            'enabled'       => true,
            'extra_charge'  => 0,
            'max_amount'    => 50000,
        ],
    ],

    // Encryption for stored credentials
    'credential_encryption' => [
        'algorithm' => 'aes-256-cbc',
        'key_env'   => 'ENCRYPTION_KEY',
    ],
];
