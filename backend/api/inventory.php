<?php
/**
 * inventory.php
 * فهرست تجهیزات و افزودن سریع برای استفاده در فرم‌ها.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $stmt = $pdo->prepare('SELECT inventory.id, inventory.name, inventory.serial, inventory.unit_id, units.name AS unit_name FROM inventory LEFT JOIN units ON units.id = inventory.unit_id WHERE inventory.name LIKE :q OR inventory.serial LIKE :q ORDER BY inventory.id DESC');
        $stmt->execute([':q' => '%' . $q . '%']);
    } else {
        $stmt = $pdo->query('SELECT inventory.id, inventory.name, inventory.serial, inventory.unit_id, units.name AS unit_name FROM inventory LEFT JOIN units ON units.id = inventory.unit_id ORDER BY inventory.id DESC LIMIT 100');
    }
    jsonResponse(['inventory' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($method === 'POST') {
    if (!in_array($auth['role'], ['admin', 'user'], true)) {
        jsonResponse(['error' => 'دسترسی غیرمجاز.'], 403);
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim((string)($body['name'] ?? ''));
    $serial = trim((string)($body['serial'] ?? ''));
    $unitId = $body['unit_id'] ?? null;
    if ($name === '') {
        jsonResponse(['error' => 'نام تجهیز الزامی است.'], 422);
    }
    $stmt = $pdo->prepare('INSERT INTO inventory (name, serial, unit_id, created_at_iso) VALUES (:name, :serial, :unit, :now)');
    $stmt->execute([
        ':name' => $name,
        ':serial' => $serial,
        ':unit' => $unitId,
        ':now' => gmdate('Y-m-d H:i:s'),
    ]);
    jsonResponse(['message' => 'تجهیز ثبت شد.']);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
