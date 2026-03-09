<?php
/**
 * Artistiya E-Commerce — Delivery Provider Configuration
 * Supports: Pathao, Steadfast, RedX, PaperFly, Manual
 */

return [
    'default_provider' => 'manual',

    'providers' => [
        'pathao' => [
            'enabled'       => false,
            'sandbox'       => true,
            'client_id'     => '',
            'client_secret' => '',
            'username'      => '',
            'password'      => '',
            'sandbox_url'   => 'https://hermes-api.p-stageenv.xyz',
            'live_url'      => 'https://api-hermes.pathao.com',
            'store_id'      => null,
            'token_cache'   => true,
        ],

        'steadfast' => [
            'enabled'    => false,
            'api_key'    => '',
            'secret_key' => '',
            'api_url'    => 'https://portal.steadfast.com.bd/api/v1',
        ],

        'redx' => [
            'enabled'  => false,
            'api_key'  => '',
            'api_url'  => 'https://openapi.redx.com.bd/v1.0.0-beta',
        ],

        'paperfly' => [
            'enabled'       => false,
            'merchant_code' => '',
            'api_key'       => '',
            'api_url'       => 'https://api.paperfly.com.bd',
        ],

        'manual' => [
            'enabled' => true,
        ],
    ],

    // Default shipping costs
    'shipping' => [
        'default_cost'          => 120,
        'free_shipping_threshold' => 5000,
        'inside_dhaka'          => 80,
        'outside_dhaka'         => 150,
        'sub_city'              => 120,
    ],
];
