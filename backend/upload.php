<?php
/**
 * File Upload Handler
 * Handles file/image uploads for forms and equipment
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $status = 400) {
    sendJson(['error' => $message], $status);
}

function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function validateToken($db, $token) {
    $stmt = $db->prepare("
        SELECT u.* FROM users u
        JOIN tokens t ON t.user_id = u.id
        WHERE t.token = ? AND t.expires_at > datetime('now')
    ");
    $stmt->execute([$token]);
    return $stmt->fetch();
}

function canAccessUnit($user, $unitId) {
    if (in_array($user['role'], ['manager', 'storekeeper', 'workshop'])) {
        return true;
    }

    if ($unitId === null) {
        return false;
    }

    if ($user['role'] === 'unit' && $user['unit_id'] == $unitId) {
        return true;
    }

    return false;
}

function resolveEntityUnitId($db, $entityType, $entityId) {
    switch ($entityType) {
        case 'exit_form':
            $stmt = $db->prepare('SELECT unit_id FROM exit_forms WHERE id = ?');
            break;
        case 'repair_form':
            $stmt = $db->prepare('SELECT unit_id FROM repair_forms WHERE id = ?');
            break;
        case 'entry_confirm':
            $stmt = $db->prepare('
                SELECT COALESCE(ef.unit_id, rf.unit_id) AS unit_id
                FROM entry_confirms ec
                LEFT JOIN exit_forms ef ON ec.reference_exit_form_id = ef.id
                LEFT JOIN repair_forms rf ON ec.reference_repair_form_id = rf.id
                WHERE ec.id = ?
            ');
            break;
        case 'equipment':
            $stmt = $db->prepare('SELECT unit_id FROM equipment WHERE id = ?');
            break;
        default:
            return false;
    }

    $stmt->execute([$entityId]);
    $row = $stmt->fetch();

    if (!$row) {
        return false;
    }

    return array_key_exists('unit_id', $row) ? $row['unit_id'] : null;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('فقط متد POST پشتیبانی می‌شود', 405);
}

// Check authentication
$dbFile = __DIR__ . '/cmms.db';
$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$token = getAuthToken();
if (!$token) {
    sendError('توکن احراز هویت الزامی است', 401);
}

$user = validateToken($db, $token);
if (!$user) {
    sendError('توکن نامعتبر یا منقضی شده است', 401);
}

// Validate request
if (!isset($_FILES['file'])) {
    sendError('فایل الزامی است');
}

$entityType = $_POST['entity_type'] ?? '';
$entityId = $_POST['entity_id'] ?? '';

if (!$entityType || !$entityId) {
    sendError('نوع و شناسه موجودیت الزامی است');
}

$allowedTypes = ['exit_form', 'repair_form', 'entry_confirm', 'equipment'];
if (!in_array($entityType, $allowedTypes)) {
    sendError('نوع موجودیت نامعتبر است');
}

if (!ctype_digit((string)$entityId)) {
    sendError('شناسه موجودیت نامعتبر است');
}

$entityId = (int)$entityId;

$entityUnitId = resolveEntityUnitId($db, $entityType, $entityId);
if ($entityUnitId === false) {
    sendError('موجودیت مورد نظر یافت نشد', 404);
}

if (!canAccessUnit($user, $entityUnitId)) {
    sendError('دسترسی به این موجودیت ندارید', 403);
}

$file = $_FILES['file'];

// Validate file
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    sendError('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
}

$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($fileExtension, $allowedExtensions)) {
    sendError('فرمت فایل مجاز نیست');
}

// Create uploads directory
$uploadDir = dirname(__DIR__) . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$fileName = uniqid() . '_' . time() . '.' . $fileExtension;
$filePath = $uploadDir . $fileName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    sendError('خطا در آپلود فایل');
}

// Save to database
try {
    $stmt = $db->prepare("
        INSERT INTO attachments (entity_type, entity_id, file_path, file_name)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $entityType,
        $entityId,
        'uploads/' . $fileName,
        $file['name']
    ]);
    
    $attachmentId = $db->lastInsertId();
    
    sendJson([
        'message' => 'فایل با موفقیت آپلود شد',
        'id' => $attachmentId,
        'file_path' => 'uploads/' . $fileName,
        'file_name' => $file['name']
    ]);
    
} catch (PDOException $e) {
    // Delete uploaded file if database insert fails
    unlink($filePath);
    sendError('خطا در ذخیره اطلاعات فایل: ' . $e->getMessage(), 500);
}
