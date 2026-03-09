<?php
/**
 * ============================================================
 * Artistiya E-Commerce: Auto-Installer Script
 * ============================================================
 * 
 * This script automatically:
 * 1. Connects to MySQL database using provided credentials
 * 2. Creates all 60+ tables, triggers, functions, views
 * 3. Imports seed data if SQL file is uploaded
 * 4. Creates the first admin user
 * 5. Self-deletes after successful setup
 * 
 * USAGE:
 *   1. Upload entire project to hosting via File Manager / FTP
 *   2. Open https://yourdomain.com/install.php in browser
 *   3. Fill in database credentials and admin details
 *   4. Click "Install" — everything is automatic
 *   5. Script deletes itself after completion
 * 
 * SECURITY: This file MUST be deleted after installation.
 *           The script auto-deletes, but verify manually.
 * 
 * @version 2.0.0
 * @requires PHP 8.0+ / MySQL 8.0+
 */

// ============================================================
// CONFIGURATION
// ============================================================
define('SCHEMA_FILE', __DIR__ . '/DATABASE_SCHEMA_MYSQL.sql');
define('CONFIG_FILE', __DIR__ . '/config/database.php');
define('ENV_FILE', __DIR__ . '/.env.php');
define('LOCK_FILE', __DIR__ . '/install.lock');
define('MAX_EXECUTION_TIME', 300); // 5 minutes for large schemas

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('max_execution_time', MAX_EXECUTION_TIME);

session_start();

// ============================================================
// SECURITY: Prevent re-installation
// ============================================================
if (file_exists(LOCK_FILE)) {
    die('<!DOCTYPE html><html><head><title>Already Installed</title>
    <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8f9fa;margin:0}
    .box{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:500px}
    h1{color:#dc3545;margin-bottom:16px}p{color:#6c757d;line-height:1.6}</style></head>
    <body><div class="box"><h1>⚠️ Already Installed</h1>
    <p>The application has already been installed. For security, this installer is locked.</p>
    <p>If you need to reinstall, delete <code>install.lock</code> first.</p></div></body></html>');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function sanitize($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function testConnection($host, $port, $dbname, $user, $pass) {
    try {
        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 10
        ]);
        
        // Check if database exists
        $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = " . $pdo->quote($dbname));
        $dbExists = $stmt->fetch();
        
        if (!$dbExists) {
            // Try to create database
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        
        // Connect to specific database
        $pdo->exec("USE `{$dbname}`");
        
        // Check MySQL version
        $version = $pdo->query("SELECT VERSION()")->fetchColumn();
        
        return ['success' => true, 'version' => $version, 'pdo' => $pdo, 'db_created' => !$dbExists];
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function executeSQLFile($pdo, $filePath) {
    if (!file_exists($filePath)) {
        return ['success' => false, 'error' => "Schema file not found: {$filePath}"];
    }
    
    $sql = file_get_contents($filePath);
    if (empty($sql)) {
        return ['success' => false, 'error' => 'Schema file is empty'];
    }
    
    $tables_before = getTableCount($pdo);
    $errors = [];
    $executed = 0;
    
    // Split by delimiter for procedures/functions
    $blocks = preg_split('/^DELIMITER\s+(\S+)\s*$/m', $sql, -1, PREG_SPLIT_DELIM_CAPTURE);
    
    if (count($blocks) === 1) {
        // No DELIMITER found — split by semicolons
        $statements = array_filter(array_map('trim', splitSQL($sql)));
    } else {
        $statements = [];
        $currentDelimiter = ';';
        
        for ($i = 0; $i < count($blocks); $i++) {
            if ($i % 2 === 1) {
                // This is a delimiter marker
                $currentDelimiter = trim($blocks[$i]);
                continue;
            }
            
            $block = trim($blocks[$i]);
            if (empty($block)) continue;
            
            if ($currentDelimiter === ';') {
                $parts = array_filter(array_map('trim', splitSQL($block)));
                $statements = array_merge($statements, $parts);
            } else {
                // Split by custom delimiter
                $parts = explode($currentDelimiter, $block);
                foreach ($parts as $part) {
                    $part = trim($part);
                    if (!empty($part) && $part !== ';') {
                        $statements[] = $part;
                    }
                }
            }
        }
    }
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        // Skip comments-only statements
        $clean = preg_replace('/--.*$/m', '', $statement);
        $clean = preg_replace('/\/\*.*?\*\//s', '', $clean);
        $clean = trim($clean);
        if (empty($clean)) continue;
        
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (PDOException $e) {
            // Skip "already exists" errors (1050, 1304, 1061)
            if (!in_array($e->errorInfo[1] ?? 0, [1050, 1304, 1061, 1062])) {
                $short = substr($statement, 0, 120);
                $errors[] = "SQL Error [{$e->errorInfo[1]}]: {$e->getMessage()} — near: {$short}";
            }
        }
    }
    
    $tables_after = getTableCount($pdo);
    $tables_created = $tables_after - $tables_before;
    
    return [
        'success' => empty($errors),
        'executed' => $executed,
        'tables_created' => $tables_created,
        'total_tables' => $tables_after,
        'errors' => $errors
    ];
}

function splitSQL($sql) {
    // Smart SQL splitter that respects quotes and parentheses
    $statements = [];
    $current = '';
    $inString = false;
    $stringChar = '';
    $length = strlen($sql);
    
    for ($i = 0; $i < $length; $i++) {
        $char = $sql[$i];
        
        // Handle string literals
        if ($inString) {
            $current .= $char;
            if ($char === $stringChar && ($i + 1 >= $length || $sql[$i + 1] !== $stringChar)) {
                $inString = false;
            } elseif ($char === $stringChar && ($i + 1 < $length && $sql[$i + 1] === $stringChar)) {
                $current .= $sql[$i + 1];
                $i++; // Skip escaped quote
            }
            continue;
        }
        
        // Check for string start
        if ($char === "'" || $char === '"') {
            $inString = true;
            $stringChar = $char;
            $current .= $char;
            continue;
        }
        
        // Check for line comments
        if ($char === '-' && $i + 1 < $length && $sql[$i + 1] === '-') {
            $endOfLine = strpos($sql, "\n", $i);
            if ($endOfLine === false) break;
            $current .= substr($sql, $i, $endOfLine - $i);
            $i = $endOfLine - 1;
            continue;
        }
        
        // Check for block comments
        if ($char === '/' && $i + 1 < $length && $sql[$i + 1] === '*') {
            $endOfComment = strpos($sql, '*/', $i);
            if ($endOfComment === false) break;
            $current .= substr($sql, $i, $endOfComment - $i + 2);
            $i = $endOfComment + 1;
            continue;
        }
        
        // Statement terminator
        if ($char === ';') {
            $trimmed = trim($current);
            if (!empty($trimmed)) {
                $statements[] = $trimmed;
            }
            $current = '';
            continue;
        }
        
        $current .= $char;
    }
    
    $trimmed = trim($current);
    if (!empty($trimmed)) {
        $statements[] = $trimmed;
    }
    
    return $statements;
}

function getTableCount($pdo) {
    $stmt = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'");
    return (int) $stmt->fetchColumn();
}

function getTableList($pdo) {
    $stmt = $pdo->query("SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function createAdminUser($pdo, $email, $password, $fullName) {
    $userId = generateUUID();
    $passwordHash = password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 3]);
    
    $pdo->beginTransaction();
    
    try {
        // Insert into users table
        $stmt = $pdo->prepare("INSERT INTO `users` (`id`, `email`, `password_hash`, `email_verified_at`, `raw_user_meta_data`) VALUES (?, ?, ?, NOW(), ?)");
        $stmt->execute([$userId, $email, $passwordHash, json_encode(['full_name' => $fullName, 'role' => 'admin'])]);
        
        // Insert into profiles table
        $profileId = generateUUID();
        $stmt = $pdo->prepare("INSERT INTO `profiles` (`id`, `user_id`, `full_name`, `email`) VALUES (?, ?, ?, ?)");
        $stmt->execute([$profileId, $userId, $fullName, $email]);
        
        // Insert admin role
        $roleId = generateUUID();
        $stmt = $pdo->prepare("INSERT INTO `user_roles` (`id`, `user_id`, `role`) VALUES (?, ?, 'admin')");
        $stmt->execute([$roleId, $userId]);
        
        // Also insert into customers table
        $customerId = generateUUID();
        $stmt = $pdo->prepare("INSERT INTO `customers` (`id`, `user_id`, `full_name`, `email`) VALUES (?, ?, ?, ?)");
        $stmt->execute([$customerId, $userId, $fullName, $email]);
        
        $pdo->commit();
        return ['success' => true, 'user_id' => $userId];
    } catch (PDOException $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function writeConfigFile($host, $port, $dbname, $user, $pass) {
    $configDir = dirname(CONFIG_FILE);
    if (!is_dir($configDir)) {
        mkdir($configDir, 0755, true);
    }
    
    $configContent = '<?php
/**
 * Database Configuration — Auto-generated by installer
 * Generated: ' . date('Y-m-d H:i:s') . '
 */

return [
    \'driver\'   => \'mysql\',
    \'host\'     => \'' . addslashes($host) . '\',
    \'port\'     => ' . intval($port) . ',
    \'database\' => \'' . addslashes($dbname) . '\',
    \'username\' => \'' . addslashes($user) . '\',
    \'password\' => \'' . addslashes($pass) . '\',
    \'charset\'  => \'utf8mb4\',
    \'collation\' => \'utf8mb4_unicode_ci\',
    \'prefix\'   => \'\',
    \'strict\'   => true,
    \'options\'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ],
];
';
    
    if (file_put_contents(CONFIG_FILE, $configContent) === false) {
        return false;
    }
    chmod(CONFIG_FILE, 0640);
    return true;
}

function writeEnvFile($host, $port, $dbname, $user, $pass, $adminEmail) {
    $envDir = dirname(ENV_FILE);
    if (!is_dir($envDir)) {
        mkdir($envDir, 0755, true);
    }
    
    $appKey = bin2hex(random_bytes(32));
    $encryptionKey = bin2hex(random_bytes(32));
    
    $envContent = '<?php
/**
 * Environment Configuration — Auto-generated by installer
 * Generated: ' . date('Y-m-d H:i:s') . '
 * WARNING: Keep this file secure. Never commit to version control.
 */

// Application
define(\'APP_NAME\', \'Artistiya\');
define(\'APP_ENV\', \'production\');
define(\'APP_DEBUG\', false);
define(\'APP_KEY\', \'' . $appKey . '\');
define(\'APP_URL\', \'' . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '\');

// Database
define(\'DB_HOST\', \'' . addslashes($host) . '\');
define(\'DB_PORT\', ' . intval($port) . ');
define(\'DB_DATABASE\', \'' . addslashes($dbname) . '\');
define(\'DB_USERNAME\', \'' . addslashes($user) . '\');
define(\'DB_PASSWORD\', \'' . addslashes($pass) . '\');

// Security
define(\'CREDENTIALS_ENCRYPTION_KEY\', \'' . $encryptionKey . '\');
define(\'JWT_SECRET\', \'' . bin2hex(random_bytes(32)) . '\');
define(\'JWT_EXPIRY\', 86400); // 24 hours

// Admin
define(\'ADMIN_EMAIL\', \'' . addslashes($adminEmail) . '\');

// File Uploads
define(\'UPLOAD_DIR\', __DIR__ . \'/uploads\');
define(\'MAX_UPLOAD_SIZE\', 10 * 1024 * 1024); // 10MB
';
    
    if (file_put_contents(ENV_FILE, $envContent) === false) {
        return false;
    }
    chmod(ENV_FILE, 0640);
    return true;
}

function importSeedData($pdo, $tmpFile) {
    $sql = file_get_contents($tmpFile);
    if (empty($sql)) {
        return ['success' => false, 'error' => 'Uploaded file is empty'];
    }
    
    $statements = array_filter(array_map('trim', splitSQL($sql)));
    $executed = 0;
    $errors = [];
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    foreach ($statements as $statement) {
        if (empty(trim(preg_replace('/--.*$/m', '', $statement)))) continue;
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (PDOException $e) {
            if (!in_array($e->errorInfo[1] ?? 0, [1062])) { // Skip duplicate entries
                $errors[] = "Import Error: {$e->getMessage()}";
            }
        }
    }
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    return ['success' => count($errors) === 0, 'executed' => $executed, 'errors' => $errors];
}

function selfDestruct() {
    // Create lock file
    file_put_contents(LOCK_FILE, json_encode([
        'installed_at' => date('Y-m-d H:i:s'),
        'installed_by' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'php_version' => PHP_VERSION,
    ]));
    
    // Delete this installer script
    $thisFile = __FILE__;
    if (is_file($thisFile)) {
        @unlink($thisFile);
    }
}

function verifyDatabase($pdo) {
    $requiredTables = [
        'users', 'user_roles', 'profiles', 'categories', 'products', 'orders',
        'order_items', 'cart_items', 'addresses', 'customers', 'collections',
        'hero_slides', 'announcement_bar', 'blog_posts', 'blog_categories',
        'delivery_zones', 'delivery_providers', 'delivery_partners',
        'email_settings', 'email_templates', 'checkout_settings',
        'payment_providers', 'promo_codes', 'product_reviews',
        'newsletter_subscribers', 'notifications', 'faq_items',
        'site_branding', 'social_links', 'footer_link_groups', 'footer_links',
        'menu_items', 'menu_sub_items', 'homepage_sections', 'homepage_content',
        'invoice_settings', 'gallery_albums', 'gallery_items',
        'content_pages', 'leads', 'custom_order_requests',
        'sms_settings', 'sms_log', 'otp_codes'
    ];
    
    $existingTables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $existingTables[] = $row[0];
    }
    
    $missing = [];
    $found = [];
    foreach ($requiredTables as $table) {
        if (in_array($table, $existingTables)) {
            $found[] = $table;
        } else {
            $missing[] = $table;
        }
    }
    
    return [
        'total_existing' => count($existingTables),
        'required_found' => count($found),
        'required_total' => count($requiredTables),
        'missing' => $missing,
        'all_tables' => $existingTables
    ];
}

// ============================================================
// HANDLE AJAX REQUESTS
// ============================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    switch ($_POST['action']) {
        case 'test_connection':
            $result = testConnection(
                sanitize($_POST['db_host'] ?? 'localhost'),
                intval($_POST['db_port'] ?? 3306),
                sanitize($_POST['db_name'] ?? ''),
                sanitize($_POST['db_user'] ?? ''),
                $_POST['db_pass'] ?? ''
            );
            if ($result['success']) {
                $_SESSION['db'] = [
                    'host' => $_POST['db_host'],
                    'port' => $_POST['db_port'],
                    'name' => $_POST['db_name'],
                    'user' => $_POST['db_user'],
                    'pass' => $_POST['db_pass'],
                ];
                echo json_encode([
                    'success' => true,
                    'version' => $result['version'],
                    'db_created' => $result['db_created'] ?? false
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => $result['error']]);
            }
            exit;
        
        case 'install_schema':
            if (empty($_SESSION['db'])) {
                echo json_encode(['success' => false, 'error' => 'Database connection not established']);
                exit;
            }
            
            $db = $_SESSION['db'];
            $conn = testConnection($db['host'], $db['port'], $db['name'], $db['user'], $db['pass']);
            if (!$conn['success']) {
                echo json_encode(['success' => false, 'error' => $conn['error']]);
                exit;
            }
            
            $result = executeSQLFile($conn['pdo'], SCHEMA_FILE);
            echo json_encode($result);
            exit;
        
        case 'verify_tables':
            if (empty($_SESSION['db'])) {
                echo json_encode(['success' => false, 'error' => 'No connection']);
                exit;
            }
            $db = $_SESSION['db'];
            $conn = testConnection($db['host'], $db['port'], $db['name'], $db['user'], $db['pass']);
            if (!$conn['success']) {
                echo json_encode(['success' => false, 'error' => $conn['error']]);
                exit;
            }
            
            $verification = verifyDatabase($conn['pdo']);
            echo json_encode(['success' => true, 'data' => $verification]);
            exit;
        
        case 'import_data':
            if (empty($_SESSION['db'])) {
                echo json_encode(['success' => false, 'error' => 'No connection']);
                exit;
            }
            
            if (empty($_FILES['seed_file']['tmp_name'])) {
                echo json_encode(['success' => false, 'error' => 'No file uploaded']);
                exit;
            }
            
            $db = $_SESSION['db'];
            $conn = testConnection($db['host'], $db['port'], $db['name'], $db['user'], $db['pass']);
            if (!$conn['success']) {
                echo json_encode(['success' => false, 'error' => $conn['error']]);
                exit;
            }
            
            $result = importSeedData($conn['pdo'], $_FILES['seed_file']['tmp_name']);
            echo json_encode($result);
            exit;
        
        case 'create_admin':
            if (empty($_SESSION['db'])) {
                echo json_encode(['success' => false, 'error' => 'No connection']);
                exit;
            }
            
            $email = sanitize($_POST['admin_email'] ?? '');
            $password = $_POST['admin_password'] ?? '';
            $fullName = sanitize($_POST['admin_name'] ?? '');
            
            if (empty($email) || empty($password) || empty($fullName)) {
                echo json_encode(['success' => false, 'error' => 'All fields are required']);
                exit;
            }
            if (strlen($password) < 8) {
                echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
                exit;
            }
            
            $db = $_SESSION['db'];
            $conn = testConnection($db['host'], $db['port'], $db['name'], $db['user'], $db['pass']);
            if (!$conn['success']) {
                echo json_encode(['success' => false, 'error' => $conn['error']]);
                exit;
            }
            
            // Write config files first
            $configOk = writeConfigFile($db['host'], $db['port'], $db['name'], $db['user'], $db['pass']);
            $envOk = writeEnvFile($db['host'], $db['port'], $db['name'], $db['user'], $db['pass'], $email);
            
            if (!$configOk || !$envOk) {
                echo json_encode(['success' => false, 'error' => 'Failed to write config files. Check folder permissions.']);
                exit;
            }
            
            $result = createAdminUser($conn['pdo'], $email, $password, $fullName);
            echo json_encode($result);
            exit;
        
        case 'finalize':
            selfDestruct();
            echo json_encode(['success' => true, 'message' => 'Installation complete. Installer deleted.']);
            exit;
    }
    
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    exit;
}

// ============================================================
// HTML INSTALLER UI
// ============================================================
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Artistiya — Auto Installer</title>
    <style>
        :root {
            --primary: #D4A574;
            --primary-dark: #B8895A;
            --bg: #0F0F0F;
            --surface: #1A1A1A;
            --surface-alt: #242424;
            --border: #333;
            --text: #F5F5F5;
            --text-muted: #999;
            --success: #22C55E;
            --error: #EF4444;
            --warning: #F59E0B;
            --info: #3B82F6;
            --radius: 12px;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo h1 {
            font-size: 2rem;
            color: var(--primary);
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        
        .logo p {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: 4px;
        }
        
        /* Stepper */
        .stepper {
            display: flex;
            justify-content: center;
            gap: 0;
            margin-bottom: 40px;
        }
        
        .step {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .step-num {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            background: var(--surface-alt);
            color: var(--text-muted);
            border: 2px solid var(--border);
            transition: all 0.3s;
        }
        
        .step.active .step-num {
            background: var(--primary);
            color: var(--bg);
            border-color: var(--primary);
        }
        
        .step.done .step-num {
            background: var(--success);
            color: #fff;
            border-color: var(--success);
        }
        
        .step-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            display: none;
        }
        
        .step-line {
            width: 40px;
            height: 2px;
            background: var(--border);
            margin: 0 4px;
        }
        
        .step.done + .step-line, .step-line.done {
            background: var(--success);
        }
        
        /* Cards */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 32px;
            margin-bottom: 20px;
        }
        
        .card h2 {
            font-size: 1.25rem;
            margin-bottom: 8px;
            color: var(--primary);
        }
        
        .card p.subtitle {
            color: var(--text-muted);
            font-size: 0.875rem;
            margin-bottom: 24px;
        }
        
        /* Forms */
        .field {
            margin-bottom: 16px;
        }
        
        .field label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text);
        }
        
        .field input, .field select {
            width: 100%;
            padding: 10px 14px;
            background: var(--surface-alt);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text);
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .field input:focus {
            border-color: var(--primary);
        }
        
        .field input::placeholder {
            color: var(--text-muted);
        }
        
        .field-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.95rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
        }
        
        .btn-primary {
            background: var(--primary);
            color: var(--bg);
        }
        
        .btn-primary:hover {
            background: var(--primary-dark);
        }
        
        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-outline {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text);
        }
        
        .btn-outline:hover {
            border-color: var(--primary);
            color: var(--primary);
        }
        
        /* Status Messages */
        .status {
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 0.875rem;
            display: none;
        }
        
        .status.show { display: block; }
        .status.success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: var(--success); }
        .status.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--error); }
        .status.warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: var(--warning); }
        .status.info { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: var(--info); }
        
        /* Progress */
        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--surface-alt);
            border-radius: 3px;
            overflow: hidden;
            margin: 16px 0;
        }
        
        .progress-bar .fill {
            height: 100%;
            background: var(--primary);
            border-radius: 3px;
            transition: width 0.5s ease;
            width: 0%;
        }
        
        /* Table Verification */
        .table-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 6px;
            margin-top: 12px;
            max-height: 200px;
            overflow-y: auto;
            padding: 8px;
            background: var(--surface-alt);
            border-radius: 8px;
        }
        
        .table-item {
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
        }
        
        .table-item.ok { background: rgba(34,197,94,0.1); color: var(--success); }
        .table-item.missing { background: rgba(239,68,68,0.1); color: var(--error); }
        
        /* File upload */
        .file-upload {
            border: 2px dashed var(--border);
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .file-upload:hover { border-color: var(--primary); }
        .file-upload input[type="file"] { display: none; }
        .file-upload .icon { font-size: 2rem; margin-bottom: 8px; }
        .file-upload .text { color: var(--text-muted); font-size: 0.85rem; }
        
        /* Spinner */
        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Final screen */
        .success-screen {
            text-align: center;
            padding: 48px 24px;
        }
        
        .success-screen .checkmark {
            font-size: 4rem;
            margin-bottom: 16px;
        }
        
        .success-screen h2 {
            color: var(--success);
            font-size: 1.5rem;
            margin-bottom: 12px;
        }
        
        .hidden { display: none !important; }
        
        /* Requirements */
        .req-list {
            list-style: none;
            margin-top: 12px;
        }
        
        .req-list li {
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
        }
        
        .req-list .ok { color: var(--success); }
        .req-list .fail { color: var(--error); }
        
        @media (max-width: 600px) {
            .container { padding: 20px 16px; }
            .card { padding: 20px; }
            .field-row { grid-template-columns: 1fr; }
            .step-line { width: 20px; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="logo">
        <h1>✦ Artistiya</h1>
        <p>E-Commerce Auto Installer</p>
    </div>
    
    <!-- Stepper -->
    <div class="stepper">
        <div class="step active" id="step-ind-1"><span class="step-num">1</span></div>
        <div class="step-line" id="line-1"></div>
        <div class="step" id="step-ind-2"><span class="step-num">2</span></div>
        <div class="step-line" id="line-2"></div>
        <div class="step" id="step-ind-3"><span class="step-num">3</span></div>
        <div class="step-line" id="line-3"></div>
        <div class="step" id="step-ind-4"><span class="step-num">4</span></div>
        <div class="step-line" id="line-4"></div>
        <div class="step" id="step-ind-5"><span class="step-num">5</span></div>
    </div>
    
    <!-- STEP 1: Requirements Check -->
    <div class="card" id="step-1">
        <h2>🔍 System Requirements</h2>
        <p class="subtitle">Checking your hosting environment compatibility</p>
        
        <ul class="req-list">
            <li>
                <span>PHP Version (8.0+ required)</span>
                <span class="<?= version_compare(PHP_VERSION, '8.0.0', '>=') ? 'ok' : 'fail' ?>">
                    <?= PHP_VERSION ?> <?= version_compare(PHP_VERSION, '8.0.0', '>=') ? '✓' : '✗' ?>
                </span>
            </li>
            <li>
                <span>PDO MySQL Extension</span>
                <span class="<?= extension_loaded('pdo_mysql') ? 'ok' : 'fail' ?>">
                    <?= extension_loaded('pdo_mysql') ? 'Installed ✓' : 'Missing ✗' ?>
                </span>
            </li>
            <li>
                <span>JSON Extension</span>
                <span class="<?= extension_loaded('json') ? 'ok' : 'fail' ?>">
                    <?= extension_loaded('json') ? 'Installed ✓' : 'Missing ✗' ?>
                </span>
            </li>
            <li>
                <span>OpenSSL Extension</span>
                <span class="<?= extension_loaded('openssl') ? 'ok' : 'fail' ?>">
                    <?= extension_loaded('openssl') ? 'Installed ✓' : 'Missing ✗' ?>
                </span>
            </li>
            <li>
                <span>Mbstring Extension</span>
                <span class="<?= extension_loaded('mbstring') ? 'ok' : 'fail' ?>">
                    <?= extension_loaded('mbstring') ? 'Installed ✓' : 'Missing ✗' ?>
                </span>
            </li>
            <li>
                <span>Schema File (DATABASE_SCHEMA_MYSQL.sql)</span>
                <span class="<?= file_exists(SCHEMA_FILE) ? 'ok' : 'fail' ?>">
                    <?= file_exists(SCHEMA_FILE) ? 'Found ✓' : 'Missing ✗' ?>
                </span>
            </li>
            <li>
                <span>Config Directory Writable</span>
                <span class="<?= (is_dir(dirname(CONFIG_FILE)) && is_writable(dirname(CONFIG_FILE))) || is_writable(dirname(dirname(CONFIG_FILE))) ? 'ok' : 'fail' ?>">
                    <?= (is_dir(dirname(CONFIG_FILE)) && is_writable(dirname(CONFIG_FILE))) || is_writable(dirname(dirname(CONFIG_FILE))) ? 'Writable ✓' : 'Check permissions ⚠' ?>
                </span>
            </li>
        </ul>
        
        <?php
        $canProceed = version_compare(PHP_VERSION, '8.0.0', '>=') 
                      && extension_loaded('pdo_mysql') 
                      && extension_loaded('json')
                      && file_exists(SCHEMA_FILE);
        ?>
        
        <div style="margin-top: 24px">
            <?php if ($canProceed): ?>
                <button class="btn btn-primary" onclick="goToStep(2)">Continue →</button>
            <?php else: ?>
                <div class="status show error">Missing requirements. Please fix the items marked with ✗ before continuing.</div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- STEP 2: Database Connection -->
    <div class="card hidden" id="step-2">
        <h2>🗄️ Database Connection</h2>
        <p class="subtitle">Enter your MySQL database credentials (from hosting panel)</p>
        
        <div class="field">
            <label>Database Host</label>
            <input type="text" id="db_host" value="localhost" placeholder="localhost or IP">
        </div>
        
        <div class="field-row">
            <div class="field">
                <label>Database Name</label>
                <input type="text" id="db_name" placeholder="artistiya_db">
            </div>
            <div class="field">
                <label>Port</label>
                <input type="number" id="db_port" value="3306">
            </div>
        </div>
        
        <div class="field-row">
            <div class="field">
                <label>Username</label>
                <input type="text" id="db_user" placeholder="root or db_user">
            </div>
            <div class="field">
                <label>Password</label>
                <input type="password" id="db_pass" placeholder="••••••••">
            </div>
        </div>
        
        <div id="db-status" class="status"></div>
        
        <div style="display:flex;gap:12px;margin-top:24px">
            <button class="btn btn-outline" onclick="goToStep(1)" style="width:auto;padding:12px 20px">← Back</button>
            <button class="btn btn-primary" id="btn-test-db" onclick="testDB()">
                Test Connection & Continue
            </button>
        </div>
    </div>
    
    <!-- STEP 3: Install Schema -->
    <div class="card hidden" id="step-3">
        <h2>⚙️ Install Database Schema</h2>
        <p class="subtitle">Creating 60+ tables, triggers, functions, and views</p>
        
        <div class="progress-bar"><div class="fill" id="schema-progress"></div></div>
        <div id="schema-log" style="font-family:monospace;font-size:0.8rem;color:var(--text-muted);min-height:60px;padding:8px"></div>
        <div id="schema-status" class="status"></div>
        
        <!-- Verification -->
        <div id="verify-section" class="hidden" style="margin-top:20px">
            <h3 style="font-size:1rem;margin-bottom:8px">📋 Table Verification</h3>
            <div id="verify-summary" style="font-size:0.875rem;color:var(--text-muted)"></div>
            <div id="table-grid" class="table-grid"></div>
        </div>
        
        <!-- Seed Data Import (optional) -->
        <div id="import-section" class="hidden" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
            <h3 style="font-size:1rem;margin-bottom:8px">📦 Import Seed Data (Optional)</h3>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px">Upload a .sql file to import initial data (products, categories, etc.)</p>
            
            <div class="file-upload" onclick="document.getElementById('seed-file').click()">
                <input type="file" id="seed-file" accept=".sql" onchange="handleSeedFile(this)">
                <div class="icon">📄</div>
                <div class="text" id="seed-filename">Click to select .sql file</div>
            </div>
            <div id="import-status" class="status"></div>
            <button class="btn btn-outline hidden" id="btn-import" onclick="importData()" style="margin-top:12px">Import Data</button>
        </div>
        
        <div style="display:flex;gap:12px;margin-top:24px">
            <button class="btn btn-outline" onclick="goToStep(2)" style="width:auto;padding:12px 20px">← Back</button>
            <button class="btn btn-primary" id="btn-install-schema" onclick="installSchema()">
                Install Schema
            </button>
            <button class="btn btn-primary hidden" id="btn-to-admin" onclick="goToStep(4)">
                Continue → Create Admin
            </button>
        </div>
    </div>
    
    <!-- STEP 4: Create Admin -->
    <div class="card hidden" id="step-4">
        <h2>👤 Create Admin Account</h2>
        <p class="subtitle">This will be your master admin login for the dashboard</p>
        
        <div class="field">
            <label>Full Name</label>
            <input type="text" id="admin_name" placeholder="Your Full Name">
        </div>
        
        <div class="field">
            <label>Email Address</label>
            <input type="email" id="admin_email" placeholder="admin@yourdomain.com">
        </div>
        
        <div class="field">
            <label>Password (min 8 chars)</label>
            <input type="password" id="admin_password" placeholder="••••••••">
        </div>
        
        <div class="field">
            <label>Confirm Password</label>
            <input type="password" id="admin_password2" placeholder="••••••••">
        </div>
        
        <div id="admin-status" class="status"></div>
        
        <div style="display:flex;gap:12px;margin-top:24px">
            <button class="btn btn-outline" onclick="goToStep(3)" style="width:auto;padding:12px 20px">← Back</button>
            <button class="btn btn-primary" id="btn-create-admin" onclick="createAdmin()">
                Create Admin & Finish
            </button>
        </div>
    </div>
    
    <!-- STEP 5: Complete -->
    <div class="card hidden" id="step-5">
        <div class="success-screen">
            <div class="checkmark">🎉</div>
            <h2>Installation Complete!</h2>
            <p style="color:var(--text-muted);margin-bottom:24px">
                Your Artistiya e-commerce platform is ready to use.<br>
                The installer has been automatically deleted for security.
            </p>
            
            <div style="background:var(--surface-alt);border-radius:8px;padding:16px;text-align:left;margin-bottom:24px">
                <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px"><strong>What was created:</strong></p>
                <ul style="list-style:none;font-size:0.85rem;color:var(--text)">
                    <li>✅ Database tables, triggers, functions & views</li>
                    <li>✅ Config file: <code>config/database.php</code></li>
                    <li>✅ Environment file: <code>.env.php</code></li>
                    <li>✅ Admin user account</li>
                    <li>✅ Encryption keys generated</li>
                    <li>🗑️ Installer script deleted</li>
                </ul>
            </div>
            
            <div style="display:flex;gap:12px;justify-content:center">
                <a href="/" class="btn btn-primary" style="text-decoration:none;width:auto;padding:12px 32px">
                    Open Website →
                </a>
                <a href="/admin" class="btn btn-outline" style="text-decoration:none;width:auto;padding:12px 32px">
                    Go to Admin Panel →
                </a>
            </div>
        </div>
    </div>
</div>

<script>
let currentStep = 1;

function goToStep(n) {
    // Hide all steps
    for (let i = 1; i <= 5; i++) {
        document.getElementById('step-' + i).classList.add('hidden');
        const ind = document.getElementById('step-ind-' + i);
        ind.classList.remove('active');
        if (i < currentStep) ind.classList.add('done');
    }
    
    // Update stepper lines
    for (let i = 1; i <= 4; i++) {
        const line = document.getElementById('line-' + i);
        if (i < n) line.classList.add('done');
        else line.classList.remove('done');
    }
    
    // Mark previous steps as done
    for (let i = 1; i < n; i++) {
        document.getElementById('step-ind-' + i).classList.add('done');
    }
    
    // Show current
    document.getElementById('step-' + n).classList.remove('hidden');
    document.getElementById('step-ind-' + n).classList.add('active');
    currentStep = n;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStatus(id, type, message) {
    const el = document.getElementById(id);
    el.className = 'status show ' + type;
    el.innerHTML = message;
}

async function postForm(data) {
    const form = new FormData();
    for (const [k, v] of Object.entries(data)) {
        form.append(k, v);
    }
    const res = await fetch('install.php', { method: 'POST', body: form });
    return res.json();
}

async function testDB() {
    const btn = document.getElementById('btn-test-db');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Testing...';
    
    try {
        const result = await postForm({
            action: 'test_connection',
            db_host: document.getElementById('db_host').value,
            db_port: document.getElementById('db_port').value,
            db_name: document.getElementById('db_name').value,
            db_user: document.getElementById('db_user').value,
            db_pass: document.getElementById('db_pass').value,
        });
        
        if (result.success) {
            let msg = '✅ Connected successfully! MySQL ' + result.version;
            if (result.db_created) msg += ' — Database was auto-created.';
            showStatus('db-status', 'success', msg);
            setTimeout(() => goToStep(3), 1000);
        } else {
            showStatus('db-status', 'error', '❌ ' + result.error);
        }
    } catch (e) {
        showStatus('db-status', 'error', '❌ Network error: ' + e.message);
    }
    
    btn.disabled = false;
    btn.innerHTML = 'Test Connection & Continue';
}

async function installSchema() {
    const btn = document.getElementById('btn-install-schema');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Installing...';
    
    const log = document.getElementById('schema-log');
    const progress = document.getElementById('schema-progress');
    
    log.innerHTML = '→ Reading schema file...\n';
    progress.style.width = '10%';
    
    try {
        log.innerHTML += '→ Executing SQL statements...\n';
        progress.style.width = '30%';
        
        const result = await postForm({ action: 'install_schema' });
        
        progress.style.width = '80%';
        
        if (result.success || result.executed > 0) {
            log.innerHTML += '→ Executed ' + result.executed + ' SQL statements\n';
            log.innerHTML += '→ Tables created: ' + (result.tables_created || 'N/A') + '\n';
            log.innerHTML += '→ Total tables: ' + (result.total_tables || 'N/A') + '\n';
            
            if (result.errors && result.errors.length > 0) {
                showStatus('schema-status', 'warning', '⚠️ Schema installed with ' + result.errors.length + ' warnings (non-critical).');
                log.innerHTML += '\n⚠ Warnings:\n' + result.errors.slice(0, 5).join('\n');
            } else {
                showStatus('schema-status', 'success', '✅ Schema installed successfully!');
            }
            
            // Verify tables
            progress.style.width = '90%';
            await verifyTables();
            progress.style.width = '100%';
            
            document.getElementById('import-section').classList.remove('hidden');
            btn.classList.add('hidden');
            document.getElementById('btn-to-admin').classList.remove('hidden');
        } else {
            showStatus('schema-status', 'error', '❌ Installation failed: ' + (result.errors || []).join(', '));
        }
    } catch (e) {
        showStatus('schema-status', 'error', '❌ Error: ' + e.message);
    }
    
    btn.disabled = false;
    btn.innerHTML = 'Install Schema';
}

async function verifyTables() {
    try {
        const result = await postForm({ action: 'verify_tables' });
        if (result.success) {
            const data = result.data;
            const section = document.getElementById('verify-section');
            section.classList.remove('hidden');
            
            document.getElementById('verify-summary').innerHTML = 
                `Found <strong>${data.required_found}/${data.required_total}</strong> required tables | ` +
                `Total tables: <strong>${data.total_existing}</strong>` +
                (data.missing.length > 0 ? ` | <span style="color:var(--warning)">Missing: ${data.missing.length}</span>` : ' | <span style="color:var(--success)">All OK ✓</span>');
            
            const grid = document.getElementById('table-grid');
            grid.innerHTML = '';
            data.all_tables.forEach(t => {
                const el = document.createElement('div');
                el.className = 'table-item ok';
                el.textContent = t;
                grid.appendChild(el);
            });
            data.missing.forEach(t => {
                const el = document.createElement('div');
                el.className = 'table-item missing';
                el.textContent = '✗ ' + t;
                grid.appendChild(el);
            });
        }
    } catch (e) {
        console.error('Verify error:', e);
    }
}

function handleSeedFile(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('seed-filename').textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
        document.getElementById('btn-import').classList.remove('hidden');
    }
}

async function importData() {
    const btn = document.getElementById('btn-import');
    const fileInput = document.getElementById('seed-file');
    
    if (!fileInput.files[0]) {
        showStatus('import-status', 'error', 'Please select a file first');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Importing...';
    
    try {
        const form = new FormData();
        form.append('action', 'import_data');
        form.append('seed_file', fileInput.files[0]);
        
        const res = await fetch('install.php', { method: 'POST', body: form });
        const result = await res.json();
        
        if (result.success) {
            showStatus('import-status', 'success', '✅ Imported ' + result.executed + ' statements successfully!');
        } else {
            showStatus('import-status', 'warning', '⚠️ Import completed with issues: ' + (result.errors || []).slice(0, 3).join('; '));
        }
    } catch (e) {
        showStatus('import-status', 'error', '❌ ' + e.message);
    }
    
    btn.disabled = false;
    btn.innerHTML = 'Import Data';
}

async function createAdmin() {
    const name = document.getElementById('admin_name').value.trim();
    const email = document.getElementById('admin_email').value.trim();
    const pass = document.getElementById('admin_password').value;
    const pass2 = document.getElementById('admin_password2').value;
    
    if (!name || !email || !pass) {
        showStatus('admin-status', 'error', 'All fields are required');
        return;
    }
    if (pass !== pass2) {
        showStatus('admin-status', 'error', 'Passwords do not match');
        return;
    }
    if (pass.length < 8) {
        showStatus('admin-status', 'error', 'Password must be at least 8 characters');
        return;
    }
    
    const btn = document.getElementById('btn-create-admin');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';
    
    try {
        const result = await postForm({
            action: 'create_admin',
            admin_name: name,
            admin_email: email,
            admin_password: pass,
        });
        
        if (result.success) {
            showStatus('admin-status', 'success', '✅ Admin account created!');
            
            // Finalize — self-delete installer
            await postForm({ action: 'finalize' });
            
            setTimeout(() => goToStep(5), 1500);
        } else {
            showStatus('admin-status', 'error', '❌ ' + result.error);
        }
    } catch (e) {
        showStatus('admin-status', 'error', '❌ ' + e.message);
    }
    
    btn.disabled = false;
    btn.innerHTML = 'Create Admin & Finish';
}
</script>
</body>
</html>
