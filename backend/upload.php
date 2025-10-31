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
    if ($unitId === null) {
        return true;
    }
    if ($user['role'] === 'manager' || $user['role'] === 'storekeeper') {
        return true;
    }
    if ($user['role'] === 'unit' && $user['unit_id'] == $unitId) {
        return true;
    }
    return false;
}

function resolveUnitId($db, $entityType, $entityId) {
    switch ($entityType) {
        case 'exit_form':
            $stmt = $db->prepare("SELECT unit_id FROM exit_forms WHERE id = ?");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch();
            if (!$row) {
                sendError('فرم خروج مورد نظر یافت نشد', 404);
            }
            return $row['unit_id'] ?? null;
        case 'repair_form':
            $stmt = $db->prepare("
                SELECT 
                    rf.unit_id,
                    ef.unit_id AS reference_exit_unit_id
                FROM repair_forms rf
                LEFT JOIN exit_forms ef ON ef.id = rf.reference_exit_form_id
                WHERE rf.id = ?
            ");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch();
            if (!$row) {
                sendError('فرم تعمیر مورد نظر یافت نشد', 404);
            }
            if ($row && array_key_exists('unit_id', $row) && $row['unit_id'] !== null) {
                return $row['unit_id'];
            }
            return $row['reference_exit_unit_id'] ?? null;
        case 'entry_confirm':
            $stmt = $db->prepare("
                SELECT 
                    ec.reference_exit_form_id,
                    ec.reference_repair_form_id,
                    direct_exit.unit_id AS direct_exit_unit_id,
                    rf.unit_id AS repair_unit_id,
                    repair_exit.unit_id AS repair_exit_unit_id
                FROM entry_confirms ec
                LEFT JOIN exit_forms direct_exit ON direct_exit.id = ec.reference_exit_form_id
                LEFT JOIN repair_forms rf ON rf.id = ec.reference_repair_form_id
                LEFT JOIN exit_forms repair_exit ON repair_exit.id = rf.reference_exit_form_id
                WHERE ec.id = ?
            ");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch();
            if (!$row) {
                sendError('تأییدیه ورود مورد نظر یافت نشد', 404);
            }
            if ($row && array_key_exists('direct_exit_unit_id', $row) && $row['direct_exit_unit_id'] !== null) {
                return $row['direct_exit_unit_id'];
            }
            if ($row && array_key_exists('repair_unit_id', $row) && $row['repair_unit_id'] !== null) {
                return $row['repair_unit_id'];
            }
            return $row['repair_exit_unit_id'] ?? null;
        case 'equipment':
            $stmt = $db->prepare("SELECT unit_id FROM equipment WHERE id = ?");
            $stmt->execute([$entityId]);
            $row = $stmt->fetch();
            if (!$row) {
                sendError('تجهیز مورد نظر یافت نشد', 404);
            }
            return $row['unit_id'] ?? null;
        default:
            return null;
    }
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

$unitId = resolveUnitId($db, $entityType, $entityId);
if (!canAccessUnit($user, $unitId)) {
    sendError('شما مجاز به دسترسی به این موجودیت نیستید', 403);
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
