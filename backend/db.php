<?php
/**
 * db.php
 * اتصال پایدار به SQLite و توابع کمکی مشترک برای API.
 */

declare(strict_types=1);

require_once __DIR__ . '/init_db.php';

const DB_PATH = __DIR__ . '/database.sqlite';

function getPDO(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $needSeed = !file_exists(DB_PATH);
        $pdo = new PDO('sqlite:' . DB_PATH);
        runMigrations($pdo, $needSeed);
    }
    return $pdo;
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getBearerToken(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? '');
    if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
        return trim($matches[1]);
    }
    $token = $_GET['token'] ?? ($_POST['token'] ?? null);
    return $token ? trim((string)$token) : null;
}

function requireAuth(?array $roles = null): array {
    $pdo = getPDO();
    $token = getBearerToken();
    if (!$token) {
        jsonResponse(['error' => 'توکن موجود نیست.'], 401);
    }

    $stmt = $pdo->prepare('SELECT t.token, t.expires_at_iso, u.id, u.username, u.role, u.unit_id FROM tokens t JOIN users u ON u.id = t.user_id WHERE t.token = :token');
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        jsonResponse(['error' => 'نشست معتبر نیست.'], 401);
    }

    if (strtotime($row['expires_at_iso']) < time()) {
        $del = $pdo->prepare('DELETE FROM tokens WHERE token = :token');
        $del->execute([':token' => $token]);
        jsonResponse(['error' => 'نشست منقضی شده است.'], 401);
    }

    if ($roles && !in_array($row['role'], $roles, true)) {
        jsonResponse(['error' => 'دسترسی غیرمجاز.'], 403);
    }

    return $row;
}

function validateItems(array $items, int $min, int $max): void {
    $count = count($items);
    if ($count < $min || $count > $max) {
        jsonResponse(['error' => "تعداد اقلام باید بین {$min} و {$max} باشد."], 422);
    }
    foreach ($items as $index => $item) {
        if (!isset($item['name']) || trim((string)$item['name']) === '') {
            jsonResponse(['error' => "شرح ردیف شماره " . ($index + 1) . " الزامی است."], 422);
        }
        if (!isset($item['status']) || trim((string)$item['status']) === '') {
            jsonResponse(['error' => "وضعیت ردیف شماره " . ($index + 1) . " الزامی است."], 422);
        }
        $qty = (int)($item['quantity'] ?? 1);
        if ($qty <= 0) {
            jsonResponse(['error' => "تعداد ردیف شماره " . ($index + 1) . " باید بیشتر از صفر باشد."], 422);
        }
        if (!isset($item['unit']) || trim((string)$item['unit']) === '') {
            jsonResponse(['error' => "واحد ردیف شماره " . ($index + 1) . " الزامی است."], 422);
        }
        if (isset($item['images']) && !is_array($item['images'])) {
            jsonResponse(['error' => 'تصاویر اقلام باید به صورت آرایه ارسال شوند.'], 422);
        }
    }
}

function generateToken(): string {
    return bin2hex(random_bytes(32));
}

function ensureUploadsDir(): void {
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

function generateShamsi(?string $iso = null): string {
    $iso = $iso ?: gmdate('Y-m-d H:i:s');
    return $iso;
}
