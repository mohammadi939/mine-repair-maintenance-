<?php
/**
 * backup.php
 * دریافت و بازیابی فایل پایگاه‌داده.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth(['admin']);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $path = DB_PATH;
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="database.sqlite"');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

if ($method === 'POST') {
    if (!isset($_FILES['backup'])) {
        jsonResponse(['error' => 'فایل ارسال نشده است.'], 422);
    }
    $file = $_FILES['backup'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['error' => 'بارگذاری فایل با خطا روبه‌رو شد.'], 422);
    }
    $tmp = $file['tmp_name'];
    if (!move_uploaded_file($tmp, DB_PATH)) {
        jsonResponse(['error' => 'ذخیره نسخه پشتیبان انجام نشد.'], 500);
    }
    jsonResponse(['message' => 'بازیابی پایگاه‌داده کامل شد.']);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
