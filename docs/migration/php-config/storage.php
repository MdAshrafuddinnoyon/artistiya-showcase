<?php
/**
 * Artistiya E-Commerce — File Storage Configuration
 * Maps Supabase storage buckets to local directories
 */

return [
    'driver' => 'local',  // local | s3

    // Local storage base path
    'base_path' => __DIR__ . '/../storage',
    'public_url' => '/storage',

    // Bucket mappings (Supabase → Local directories)
    'buckets' => [
        'product-images' => [
            'path'         => 'products',
            'public'       => true,
            'max_size'     => 10 * 1024 * 1024,  // 10MB
            'allowed_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
        ],
        'custom-designs' => [
            'path'         => 'custom-designs',
            'public'       => true,
            'max_size'     => 20 * 1024 * 1024,  // 20MB
            'allowed_types' => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        ],
        'media' => [
            'path'         => 'media',
            'public'       => true,
            'max_size'     => 15 * 1024 * 1024,
            'allowed_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4'],
        ],
        'testimonials' => [
            'path'         => 'testimonials',
            'public'       => true,
            'max_size'     => 5 * 1024 * 1024,
            'allowed_types' => ['image/jpeg', 'image/png', 'image/webp'],
        ],
    ],

    // Image processing
    'image' => [
        'quality'       => 85,
        'max_dimension' => 2048,
        'thumbnail_sizes' => [
            'thumb'  => [150, 150],
            'medium' => [600, 600],
            'large'  => [1200, 1200],
        ],
    ],

    // S3 configuration (optional, for AWS S3 or compatible)
    's3' => [
        'key'      => '',
        'secret'   => '',
        'region'   => 'ap-southeast-1',
        'bucket'   => '',
        'endpoint' => '',
        'url'      => '',
    ],
];
