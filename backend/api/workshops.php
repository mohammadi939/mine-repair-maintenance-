<?php
/**
 * workshops.php
 * مدیریت کارگاه‌ها با امکان جستجو و افزودن سریع.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $stmt = $pdo->prepare('SELECT id, name FROM workshops WHERE name LIKE :q ORDER BY name');
        $stmt->execute([':q' => '%' . $q . '%']);
    } else {
        $stmt = $pdo->query('SELECT id, name FROM workshops ORDER BY name');
    }
    jsonResponse(['workshops' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($method === 'POST') {
    if (!in_array($auth['role'], ['admin', 'user'], true)) {
        jsonResponse(['error' => 'دسترسی غیرمجاز.'], 403);
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') {
        jsonResponse(['error' => 'نام کارگاه الزامی است.'], 422);
    }
    $stmt = $pdo->prepare('INSERT INTO workshops (name, created_at_iso) VALUES (:name, :now)');
    try {
        $stmt->execute([':name' => $name, ':now' => gmdate('Y-m-d H:i:s')]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'نام کارگاه تکراری است.'], 409);
    }
    jsonResponse(['message' => 'کارگاه ثبت شد.']);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
