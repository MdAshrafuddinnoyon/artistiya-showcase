<?php
/**
 * Generic CRUD Handler
 * Mirrors Supabase PostgREST-style query parameters.
 * 
 * Query params:
 *   eq.field=value     → WHERE field = value
 *   neq.field=value    → WHERE field != value
 *   gt.field=value     → WHERE field > value
 *   gte.field=value    → WHERE field >= value
 *   lt.field=value     → WHERE field < value
 *   lte.field=value    → WHERE field <= value
 *   in.field=["a","b"] → WHERE field IN ('a','b')
 *   like.field=value   → WHERE field LIKE value
 *   is.field=null      → WHERE field IS NULL
 *   order=field.desc   → ORDER BY field DESC
 *   limit=10           → LIMIT 10
 *   offset=0           → OFFSET 0
 *   select=col1,col2   → SELECT col1, col2
 *   single=true        → Return single object instead of array
 */

require_once __DIR__ . '/middleware.php';

// Tables that require authentication for write operations
$AUTH_REQUIRED_TABLES = [
    'cart_items', 'addresses', 'orders', 'order_items', 'wishlist_items',
    'custom_order_requests', 'profiles', 'product_reviews',
];

// Tables that require admin for write operations
$ADMIN_REQUIRED_TABLES = [
    'users', 'user_roles', 'categories', 'products', 'product_variants',
    'product_colors', 'product_sizes', 'collections', 'collection_products',
    'hero_slides', 'featured_sections', 'making_section', 'homepage_content',
    'homepage_sections', 'announcement_bar', 'blog_categories', 'blog_posts',
    'blog_settings', 'content_pages', 'faq_items', 'gallery_albums', 'gallery_items',
    'instagram_posts', 'youtube_videos', 'certifications', 'menu_items', 'menu_sub_items',
    'footer_link_groups', 'footer_links', 'footer_payment_banners',
    'site_branding', 'site_settings', 'site_integrations', 'theme_settings',
    'category_display_settings', 'shop_settings', 'shop_page_settings', 'filter_settings',
    'email_settings', 'email_templates', 'checkout_settings', 'checkout_fraud_settings',
    'payment_providers', 'delivery_partners', 'delivery_providers', 'delivery_zones',
    'promo_codes', 'product_bundles', 'bundle_products', 'upsell_offers',
    'team_members', 'social_links', 'currency_rates', 'invoice_settings',
    'blocked_customers', 'notifications', 'newsletter_settings', 'sms_settings',
    'qr_discount_settings', 'customization_settings', 'customers', 'crm_reports',
    'abandoned_carts', 'leads',
];

// Tables readable by public (no auth)
$PUBLIC_READ_TABLES = [
    'products', 'categories', 'collections', 'collection_products',
    'hero_slides', 'featured_sections', 'making_section', 'homepage_content',
    'homepage_sections', 'announcement_bar', 'blog_categories', 'blog_posts',
    'blog_settings', 'content_pages', 'faq_items', 'gallery_albums', 'gallery_items',
    'instagram_posts', 'youtube_videos', 'certifications', 'menu_items', 'menu_sub_items',
    'footer_link_groups', 'footer_links', 'footer_payment_banners',
    'site_branding', 'site_settings', 'site_integrations', 'theme_settings',
    'category_display_settings', 'shop_settings', 'shop_page_settings', 'filter_settings',
    'testimonials', 'social_links', 'currency_rates', 'team_members',
    'delivery_zones', 'checkout_settings', 'newsletter_settings',
    'customization_settings', 'payment_providers', 'product_variants',
    'product_colors', 'product_sizes', 'reviews', 'product_reviews',
    'newsletter_subscribers', 'qr_discount_settings',
    'orders', 'order_items', 'promo_codes', 'notifications',
];

function handleCRUD(string $table): void {
    global $AUTH_REQUIRED_TABLES, $ADMIN_REQUIRED_TABLES, $PUBLIC_READ_TABLES;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $pdo = getDB();
    
    // ── Authorization ────────────────────────────────────────
    $user = optionalAuth();
    
    if ($method === 'GET') {
        // Public tables can be read without auth
        if (!in_array($table, $PUBLIC_READ_TABLES) && !$user) {
            jsonError('Authentication required', 401);
        }
    } else {
        // Write operations
        if (in_array($table, $ADMIN_REQUIRED_TABLES)) {
            $user = requireAdmin();
        } elseif (in_array($table, $AUTH_REQUIRED_TABLES)) {
            if (!$user) jsonError('Authentication required', 401);
        }
    }
    
    switch ($method) {
        case 'GET':
            handleSelect($pdo, $table, $user);
            break;
        case 'POST':
            handleInsert($pdo, $table, $user);
            break;
        case 'PATCH':
        case 'PUT':
            handleUpdate($pdo, $table, $user);
            break;
        case 'DELETE':
            handleDelete($pdo, $table, $user);
            break;
        default:
            jsonError('Method not allowed', 405);
    }
}

function parseFilters(): array {
    $where = [];
    $params = [];
    
    foreach ($_GET as $key => $value) {
        if (preg_match('/^eq\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            if ($value === 'true') $value = 1;
            elseif ($value === 'false') $value = 0;
            $where[] = "`{$col}` = ?";
            $params[] = $value;
        } elseif (preg_match('/^neq\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` != ?";
            $params[] = $value;
        } elseif (preg_match('/^gt\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` > ?";
            $params[] = $value;
        } elseif (preg_match('/^gte\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` >= ?";
            $params[] = $value;
        } elseif (preg_match('/^lt\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` < ?";
            $params[] = $value;
        } elseif (preg_match('/^lte\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` <= ?";
            $params[] = $value;
        } elseif (preg_match('/^in\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $values = json_decode($value, true);
            if (is_array($values) && count($values) > 0) {
                $placeholders = implode(',', array_fill(0, count($values), '?'));
                $where[] = "`{$col}` IN ({$placeholders})";
                $params = array_merge($params, $values);
            }
        } elseif (preg_match('/^like\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "`{$col}` LIKE ?";
            $params[] = $value;
        } elseif (preg_match('/^is\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            if ($value === 'null') {
                $where[] = "`{$col}` IS NULL";
            } elseif ($value === 'not.null') {
                $where[] = "`{$col}` IS NOT NULL";
            }
        } elseif (preg_match('/^ilike\.(.+)$/', $key, $m)) {
            $col = validateColumn($m[1]);
            $where[] = "LOWER(`{$col}`) LIKE LOWER(?)";
            $params[] = $value;
        } elseif (preg_match('/^not\.([a-z]+)\.(.+)$/', $key, $m)) {
            // NOT filters: not.eq.col=val, not.is.col=null, not.in.col=[...]
            $op = $m[1];
            $col = validateColumn($m[2]);
            switch ($op) {
                case 'eq':
                    $where[] = "`{$col}` != ?";
                    $params[] = $value;
                    break;
                case 'is':
                    if ($value === 'null') $where[] = "`{$col}` IS NOT NULL";
                    break;
                case 'in':
                    $vals = json_decode($value, true);
                    if (is_array($vals) && count($vals) > 0) {
                        $ph = implode(',', array_fill(0, count($vals), '?'));
                        $where[] = "`{$col}` NOT IN ({$ph})";
                        $params = array_merge($params, $vals);
                    }
                    break;
                case 'like':
                    $where[] = "`{$col}` NOT LIKE ?";
                    $params[] = $value;
                    break;
                case 'ilike':
                    $where[] = "LOWER(`{$col}`) NOT LIKE LOWER(?)";
                    $params[] = $value;
                    break;
            }
        } elseif ($key === 'or') {
            // OR filter: or=(name.ilike.%q%,description.ilike.%q%)
            $orResult = parseOrFilter($value);
            if ($orResult) {
                $where[] = $orResult['sql'];
                $params = array_merge($params, $orResult['params']);
            }
        }
    }
    
    return [$where, $params];
}

/**
 * Parse Supabase-style OR filter string.
 * Example: "name.ilike.%search%,description.ilike.%search%"
 * Example: "is_global.eq.true,user_id.eq.abc-123"
 */
function parseOrFilter(string $orString): ?array {
    // Remove wrapping parentheses if present
    $orString = trim($orString, '()');
    if (empty($orString)) return null;
    
    // Split by comma, but respect nested parentheses
    $conditions = [];
    $current = '';
    $depth = 0;
    for ($i = 0; $i < strlen($orString); $i++) {
        $ch = $orString[$i];
        if ($ch === '(') $depth++;
        elseif ($ch === ')') $depth--;
        elseif ($ch === ',' && $depth === 0) {
            $conditions[] = trim($current);
            $current = '';
            continue;
        }
        $current .= $ch;
    }
    if ($current !== '') $conditions[] = trim($current);
    
    $sqlParts = [];
    $params = [];
    
    foreach ($conditions as $cond) {
        // Format: column.operator.value
        if (preg_match('/^([a-z_][a-z0-9_]*)\.([a-z]+)\.(.+)$/i', $cond, $m)) {
            $col = validateColumn($m[1]);
            $op = $m[2];
            $val = $m[3];
            
            switch ($op) {
                case 'eq':
                    if ($val === 'true') $val = 1;
                    elseif ($val === 'false') $val = 0;
                    $sqlParts[] = "`{$col}` = ?";
                    $params[] = $val;
                    break;
                case 'neq':
                    $sqlParts[] = "`{$col}` != ?";
                    $params[] = $val;
                    break;
                case 'gt':
                    $sqlParts[] = "`{$col}` > ?";
                    $params[] = $val;
                    break;
                case 'gte':
                    $sqlParts[] = "`{$col}` >= ?";
                    $params[] = $val;
                    break;
                case 'lt':
                    $sqlParts[] = "`{$col}` < ?";
                    $params[] = $val;
                    break;
                case 'lte':
                    $sqlParts[] = "`{$col}` <= ?";
                    $params[] = $val;
                    break;
                case 'like':
                    $sqlParts[] = "`{$col}` LIKE ?";
                    $params[] = $val;
                    break;
                case 'ilike':
                    $sqlParts[] = "LOWER(`{$col}`) LIKE LOWER(?)";
                    $params[] = $val;
                    break;
                case 'is':
                    if ($val === 'null') $sqlParts[] = "`{$col}` IS NULL";
                    elseif ($val === 'true') { $sqlParts[] = "`{$col}` = ?"; $params[] = 1; }
                    elseif ($val === 'false') { $sqlParts[] = "`{$col}` = ?"; $params[] = 0; }
                    break;
            }
        }
    }
    
    if (empty($sqlParts)) return null;
    
    return [
        'sql' => '(' . implode(' OR ', $sqlParts) . ')',
        'params' => $params,
    ];
}

function validateColumn(string $col): string {
    if (!preg_match('/^[a-z_][a-z0-9_]*$/i', $col)) {
        jsonError('Invalid column name: ' . $col, 400);
    }
    return $col;
}

function handleSelect(PDO $pdo, string $table, ?array $user): void {
    $columns = $_GET['select'] ?? '*';
    
    // Validate column names if specified
    if ($columns !== '*') {
        $cols = array_map('trim', explode(',', $columns));
        $validated = [];
        foreach ($cols as $c) {
            // Handle column aliases and relations
            if (preg_match('/^[a-z_][a-z0-9_]*$/i', $c)) {
                $validated[] = "`{$c}`";
            } else {
                $validated[] = $c; // Pass through complex expressions
            }
        }
        $columns = implode(', ', $validated);
    }
    
    [$where, $params] = parseFilters();
    
    // User-scoped tables (non-admin users can only see their own data)
    $userScopedTables = ['cart_items', 'addresses', 'wishlist_items', 'custom_order_requests'];
    if ($user && !isAdmin($user) && in_array($table, $userScopedTables)) {
        $where[] = "`user_id` = ?";
        $params[] = $user['user_id'];
    }
    
    // Orders: non-admin users can only see their own orders
    if (in_array($table, ['orders', 'order_items']) && $user && !isAdmin($user)) {
        if ($table === 'orders') {
            $where[] = "`user_id` = ?";
            $params[] = $user['user_id'];
        }
        // order_items: allow if querying by order_id (user ownership checked at order level)
    }
    
    // Orders: allow public tracking by order_number (no auth needed)
    // This is handled by allowing orders in PUBLIC_READ_TABLES
    
    $whereSQL = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Order — support multiple order columns via comma separation
    $orderSQL = '';
    if (isset($_GET['order'])) {
        $orderParts = explode(',', $_GET['order']);
        $orderClauses = [];
        foreach ($orderParts as $orderPart) {
            $parts = explode('.', trim($orderPart));
            $orderCol = validateColumn($parts[0]);
            $orderDir = (isset($parts[1]) && strtolower($parts[1]) === 'desc') ? 'DESC' : 'ASC';
            $orderClauses[] = "`{$orderCol}` {$orderDir}";
        }
        if (!empty($orderClauses)) {
            $orderSQL = "ORDER BY " . implode(', ', $orderClauses);
        }
    }
    
    // Limit & Offset
    $limit = isset($_GET['limit']) ? min(1000, max(1, intval($_GET['limit']))) : 1000;
    $offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;
    
    // Count mode
    $doCount = isset($_GET['count']) && $_GET['count'] === 'exact';
    $totalCount = null;
    if ($doCount) {
        $countSQL = "SELECT COUNT(*) FROM `{$table}` {$whereSQL}";
        $countStmt = $pdo->prepare($countSQL);
        $countStmt->execute($params);
        $totalCount = (int) $countStmt->fetchColumn();
        header("X-Total-Count: {$totalCount}");
    }
    
    $sql = "SELECT {$columns} FROM `{$table}` {$whereSQL} {$orderSQL} LIMIT {$limit} OFFSET {$offset}";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll();
    
    // Parse JSON columns
    $data = array_map(function($row) {
        foreach ($row as $key => &$value) {
            if (is_string($value) && (str_starts_with($value, '[') || str_starts_with($value, '{'))) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $value = $decoded;
                }
            }
        }
        return $row;
    }, $data);
    
    // Single mode
    if (isset($_GET['single']) && $_GET['single'] === 'true') {
        jsonResponse($data[0] ?? null);
    }
    
    jsonResponse($data);
}

function handleInsert(PDO $pdo, string $table, ?array $user): void {
    $body = getJsonBody();
    
    if (empty($body)) {
        jsonError('No data provided');
    }
    
    // Handle array of records (bulk insert)
    $records = isset($body[0]) ? $body : [$body];
    $insertedIds = [];
    
    foreach ($records as $record) {
        // Auto-set user_id for user-scoped tables
        $userScopedTables = ['cart_items', 'addresses', 'wishlist_items', 'custom_order_requests', 'product_reviews'];
        if ($user && in_array($table, $userScopedTables) && !isset($record['user_id'])) {
            $record['user_id'] = $user['user_id'];
        }
        
        // Auto-generate UUID if not provided
        if (!isset($record['id'])) {
            $record['id'] = generateUUID();
        }
        
        // Encode JSON fields
        foreach ($record as $key => &$value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }
        }
        
        $cols = array_keys($record);
        $validatedCols = array_map('validateColumn', $cols);
        $colStr = implode(', ', array_map(fn($c) => "`{$c}`", $validatedCols));
        $placeholders = implode(', ', array_fill(0, count($cols), '?'));
        
        $sql = "INSERT INTO `{$table}` ({$colStr}) VALUES ({$placeholders})";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($record));
        
        $insertedIds[] = $record['id'];
    }
    
    // Return inserted records
    if (count($insertedIds) === 1) {
        $stmt = $pdo->prepare("SELECT * FROM `{$table}` WHERE `id` = ?");
        $stmt->execute([$insertedIds[0]]);
        jsonResponse($stmt->fetch(), 201);
    }
    
    $placeholders = implode(',', array_fill(0, count($insertedIds), '?'));
    $stmt = $pdo->prepare("SELECT * FROM `{$table}` WHERE `id` IN ({$placeholders})");
    $stmt->execute($insertedIds);
    jsonResponse($stmt->fetchAll(), 201);
}

function handleUpdate(PDO $pdo, string $table, ?array $user): void {
    $body = getJsonBody();
    
    if (empty($body)) {
        jsonError('No data provided');
    }
    
    [$where, $params] = parseFilters();
    
    if (empty($where)) {
        jsonError('Filters required for update (use eq.field=value)');
    }
    
    // Encode JSON fields
    foreach ($body as $key => &$value) {
        if (is_array($value)) {
            $value = json_encode($value);
        }
    }
    
    $setClauses = [];
    $setParams = [];
    foreach ($body as $col => $value) {
        $validCol = validateColumn($col);
        $setClauses[] = "`{$validCol}` = ?";
        $setParams[] = $value;
    }
    
    $setSQL = implode(', ', $setClauses);
    $whereSQL = implode(' AND ', $where);
    
    $sql = "UPDATE `{$table}` SET {$setSQL} WHERE {$whereSQL}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge($setParams, $params));
    
    // Return updated records
    $selectStmt = $pdo->prepare("SELECT * FROM `{$table}` WHERE {$whereSQL}");
    $selectStmt->execute($params);
    $result = $selectStmt->fetchAll();
    
    jsonResponse(count($result) === 1 ? $result[0] : $result);
}

function handleDelete(PDO $pdo, string $table, ?array $user): void {
    [$where, $params] = parseFilters();
    
    if (empty($where)) {
        jsonError('Filters required for delete (use eq.field=value)');
    }
    
    $whereSQL = implode(' AND ', $where);
    
    $sql = "DELETE FROM `{$table}` WHERE {$whereSQL}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    jsonResponse(['deleted' => $stmt->rowCount()]);
}

function isAdmin(?array $user): bool {
    if (!$user) return false;
    return isset($user['is_admin']) && $user['is_admin'] === true;
}
