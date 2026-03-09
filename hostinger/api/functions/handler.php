<?php
/**
 * Functions Handler — Replaces Supabase Edge Functions
 * POST /api/functions/{function_name}
 * 
 * Maps edge function names to PHP implementations.
 */

require_once __DIR__ . '/../middleware.php';

$functionName = $_GET['function_name'] ?? '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body = getJsonBody();

switch ($functionName) {
    case 'create-order':
        require_once __DIR__ . '/../orders/create.php';
        break;
        
    case 'send-order-email':
        require_once __DIR__ . '/../email/send.php';
        break;
        
    case 'send-sms':
        require_once __DIR__ . '/../sms/send.php';
        break;
        
    case 'generate-invoice':
        handleGenerateInvoice($body);
        break;
        
    case 'generate-delivery-slip':
        handleGenerateDeliverySlip($body);
        break;
        
    case 'delivery-api':
        require_once __DIR__ . '/../delivery/dispatch.php';
        break;
        
    case 'bkash-payment':
        require_once __DIR__ . '/../payments/bkash.php';
        break;
        
    case 'nagad-payment':
        require_once __DIR__ . '/../payments/nagad.php';
        break;
        
    case 'sslcommerz-payment':
        require_once __DIR__ . '/../payments/sslcommerz.php';
        break;
        
    case 'aamarpay-payment':
        require_once __DIR__ . '/../payments/aamarpay.php';
        break;
        
    case 'surjopay-payment':
        require_once __DIR__ . '/../payments/surjopay.php';
        break;
        
    case 'encrypt-credentials':
        handleEncryptCredentials($body);
        break;
        
    case 'fetch-google-reviews':
        handleFetchGoogleReviews($body);
        break;
        
    default:
        jsonError("Function not found: {$functionName}", 404);
}

// ── Function Implementations ──────────────────────────────

function handleGenerateInvoice(array $body): void {
    $user = requireAdmin();
    $orderId = $body['order_id'] ?? null;
    
    if (!$orderId) jsonError('order_id required');
    
    $pdo = getDB();
    
    // Get order with items
    $stmt = $pdo->prepare("SELECT o.*, a.full_name, a.phone, a.division, a.district, a.thana, a.address_line 
                           FROM orders o LEFT JOIN addresses a ON a.id = o.address_id WHERE o.id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) jsonError('Order not found', 404);
    
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $items = $stmt->fetchAll();
    
    // Get invoice settings
    $stmt = $pdo->query("SELECT * FROM invoice_settings LIMIT 1");
    $settings = $stmt->fetch() ?: [];
    
    jsonResponse([
        'order' => $order,
        'items' => $items,
        'settings' => $settings,
        'generated_at' => date('Y-m-d H:i:s'),
    ]);
}

function handleGenerateDeliverySlip(array $body): void {
    $user = requireAdmin();
    $orderId = $body['order_id'] ?? null;
    
    if (!$orderId) jsonError('order_id required');
    
    $pdo = getDB();
    
    $stmt = $pdo->prepare("SELECT o.*, a.full_name, a.phone, a.division, a.district, a.thana, a.address_line 
                           FROM orders o LEFT JOIN addresses a ON a.id = o.address_id WHERE o.id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) jsonError('Order not found', 404);
    
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $items = $stmt->fetchAll();
    
    jsonResponse([
        'order' => $order,
        'items' => $items,
        'generated_at' => date('Y-m-d H:i:s'),
    ]);
}

function handleEncryptCredentials(array $body): void {
    $user = requireAdmin();
    
    $plaintext = $body['plaintext'] ?? '';
    if (empty($plaintext)) jsonError('plaintext required');
    
    $key = defined('CREDENTIALS_ENCRYPTION_KEY') ? CREDENTIALS_ENCRYPTION_KEY : '';
    if (empty($key)) jsonError('Encryption key not configured');
    
    $encrypted = 'enc:' . base64_encode(openssl_encrypt($plaintext, 'aes-256-cbc', hex2bin($key), OPENSSL_RAW_DATA, str_repeat("\0", 16)));
    
    jsonResponse(['encrypted' => $encrypted]);
}

function handleFetchGoogleReviews(array $body): void {
    $user = requireAdmin();
    
    $pdo = getDB();
    $stmt = $pdo->query("SELECT google_place_id, google_api_key FROM site_branding LIMIT 1");
    $branding = $stmt->fetch();
    
    if (!$branding || empty($branding['google_place_id']) || empty($branding['google_api_key'])) {
        jsonError('Google Place ID or API Key not configured');
    }
    
    $placeId = $branding['google_place_id'];
    $apiKey = $branding['google_api_key'];
    
    $url = "https://maps.googleapis.com/maps/api/place/details/json?place_id={$placeId}&fields=reviews&key={$apiKey}";
    
    $response = file_get_contents($url);
    if (!$response) jsonError('Failed to fetch Google reviews');
    
    $data = json_decode($response, true);
    $reviews = $data['result']['reviews'] ?? [];
    
    jsonResponse(['reviews' => $reviews]);
}
