<?php
/** Public: Site Branding */
require_once __DIR__ . '/../../bootstrap.php';
$pdo = getDB();
$stmt = $pdo->query("SELECT * FROM site_branding LIMIT 1");
jsonResponse($stmt->fetch() ?: []);
