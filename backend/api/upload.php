<?php
/**
 * upload.php
 * بارگذاری فایل برای درخواست‌ها و اقلام.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

ensureUploadsDir();
$pdo = getPDO();
$auth = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'متد نامعتبر است.'], 405);
}

if (!isset($_FILES['file'])) {
    jsonResponse(['error' => 'فایل ارسال نشده است.'], 422);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['error' => 'بارگذاری فایل با خطا روبه‌رو شد.'], 422);
}

$entityId = (int)($_POST['request_id'] ?? 0);
$itemIndex = isset($_POST['item_index']) ? (int)$_POST['item_index'] : null;
$type = $_POST['type'] ?? 'generic';

if ($entityId <= 0) {
    jsonResponse(['error' => 'شناسه درخواست نامعتبر است.'], 422);
}

$stmt = $pdo->prepare('SELECT requester_unit_id FROM requests WHERE id = :id');
$stmt->execute([':id' => $entityId]);
$request = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$request) {
    jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
}
if ($auth['role'] === 'user' && $auth['unit_id'] && $request['requester_unit_id'] && (int)$request['requester_unit_id'] !== (int)$auth['unit_id']) {
    jsonResponse(['error' => 'دسترسی ندارید.'], 403);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$ext = strtolower($ext);
$allowed = ['png','jpg','jpeg','gif','pdf'];
if ($ext === '' || !in_array($ext, $allowed, true)) {
    jsonResponse(['error' => 'نوع فایل مجاز نیست.'], 422);
}

$filename = uniqid('upload_', true) . '.' . $ext;
$target = __DIR__ . '/../uploads/' . $filename;
if (!move_uploaded_file($file['tmp_name'], $target)) {
    jsonResponse(['error' => 'ذخیره فایل انجام نشد.'], 500);
}

$stmt = $pdo->prepare('INSERT INTO attachments (request_id, item_index, path, type, created_at_iso) VALUES (:rid, :item, :path, :type, :now)');
$stmt->execute([
    ':rid' => $entityId,
    ':item' => $itemIndex,
    ':path' => 'uploads/' . $filename,
    ':type' => $type,
    ':now' => gmdate('Y-m-d H:i:s'),
]);

jsonResponse(['message' => 'فایل ذخیره شد.', 'path' => 'uploads/' . $filename]);
