<?php
/**
 * auth.php
 * ورود، خروج و دریافت اطلاعات کاربر با توکن.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');
    if ($username === '' || $password === '') {
        jsonResponse(['error' => 'نام کاربری و رمز عبور الزامی است.'], 422);
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username');
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'اطلاعات ورود نادرست است.'], 401);
    }
    $token = generateToken();
    $expires = gmdate('Y-m-d H:i:s', time() + 24 * 3600);
    $pdo->prepare('INSERT INTO tokens (token, user_id, expires_at_iso, created_at_iso) VALUES (:token, :uid, :exp, :now)')
        ->execute([
            ':token' => $token,
            ':uid' => $user['id'],
            ':exp' => $expires,
            ':now' => gmdate('Y-m-d H:i:s'),
        ]);
    jsonResponse(['token' => $token, 'expires_at' => $expires, 'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'unit_id' => $user['unit_id'],
    ]]);
}

if ($method === 'DELETE') {
    $auth = requireAuth();
    $token = getBearerToken();
    $pdo->prepare('DELETE FROM tokens WHERE token = :token')->execute([':token' => $token]);
    jsonResponse(['message' => 'خروج با موفقیت انجام شد.']);
}

if ($method === 'GET') {
    $auth = requireAuth();
    jsonResponse(['user' => [
        'id' => $auth['id'],
        'username' => $auth['username'],
        'role' => $auth['role'],
        'unit_id' => $auth['unit_id'],
    ]]);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
