<?php
/**
 * users.php
 * مدیریت کاربران (CRUD) ویژه نقش مدیر.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth(['admin']);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, username, role, unit_id, created_at_iso FROM users ORDER BY id DESC');
    jsonResponse(['users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');
    $role = (string)($input['role'] ?? 'user');
    $unitId = $input['unit_id'] ?? null;

    if ($username === '' || $password === '') {
        jsonResponse(['error' => 'نام کاربری و رمز عبور الزامی است.'], 422);
    }
    if (!in_array($role, ['admin', 'user', 'viewer'], true)) {
        jsonResponse(['error' => 'نقش نامعتبر است.'], 422);
    }
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role, unit_id, created_at_iso, created_at_shamsi) VALUES (:username, :hash, :role, :unit, :iso, :shamsi)');
    try {
        $now = gmdate('Y-m-d H:i:s');
        $stmt->execute([
            ':username' => $username,
            ':hash' => password_hash($password, PASSWORD_DEFAULT),
            ':role' => $role,
            ':unit' => $unitId,
            ':iso' => $now,
            ':shamsi' => $now,
        ]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'نام کاربری تکراری است.'], 409);
    }
    jsonResponse(['message' => 'کاربر جدید ایجاد شد.']);
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['error' => 'شناسه نامعتبر است.'], 422);
    }
    $username = trim((string)($input['username'] ?? ''));
    $role = (string)($input['role'] ?? 'user');
    $unitId = $input['unit_id'] ?? null;
    $password = $input['password'] ?? null;
    if ($username === '') {
        jsonResponse(['error' => 'نام کاربری الزامی است.'], 422);
    }
    if (!in_array($role, ['admin', 'user', 'viewer'], true)) {
        jsonResponse(['error' => 'نقش نامعتبر است.'], 422);
    }
    $params = [
        ':username' => $username,
        ':role' => $role,
        ':unit' => $unitId,
        ':id' => $id,
    ];
    $sql = 'UPDATE users SET username = :username, role = :role, unit_id = :unit';
    if ($password) {
        $sql .= ', password_hash = :hash';
        $params[':hash'] = password_hash((string)$password, PASSWORD_DEFAULT);
    }
    $sql .= ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse(['message' => 'کاربر به‌روزرسانی شد.']);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['error' => 'شناسه نامعتبر است.'], 422);
    }
    if ($id === (int)$auth['id']) {
        jsonResponse(['error' => 'امکان حذف حساب خود وجود ندارد.'], 422);
    }
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
    $stmt->execute([':id' => $id]);
    jsonResponse(['message' => 'کاربر حذف شد.']);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
