<?php
/**
 * requests.php
 * مدیریت درخواست‌ها، به‌روزرسانی وضعیت اقلام، گزارش‌گیری و صدور QR.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

$statuses = ['ارسال به تعمیرگاه','در حال تعمیر','تعمیر شده','غیر قابل تعمیر','صرفه اقتصادی ندارد','داغی','نامعلوم'];

function userCanEdit(array $auth): bool {
    return in_array($auth['role'], ['admin', 'user'], true);
}

function hydrateItems(array $items, array $statuses): array {
    foreach ($items as &$item) {
        $item['name'] = trim((string)($item['name'] ?? ''));
        $item['serial'] = trim((string)($item['serial'] ?? ''));
        $item['status'] = in_array($item['status'] ?? '', $statuses, true) ? $item['status'] : $statuses[0];
        $item['unit'] = trim((string)($item['unit'] ?? 'عدد'));
        $item['quantity'] = (int)($item['quantity'] ?? 1);
        $item['note'] = trim((string)($item['note'] ?? ''));
        $item['beforeImages'] = array_values(array_filter($item['beforeImages'] ?? []));
        $item['afterImages'] = array_values(array_filter($item['afterImages'] ?? []));
    }
    return $items;
}

function insertHistory(PDO $pdo, int $requestId, int $itemIndex, string $status, ?string $note, ?int $userId): void {
    $now = gmdate('Y-m-d H:i:s');
    $stmt = $pdo->prepare('INSERT INTO history (request_id, item_index, status, note, user_id, timestamp_iso, timestamp_shamsi) VALUES (:rid, :idx, :status, :note, :user, :iso, :shamsi)');
    $stmt->execute([
        ':rid' => $requestId,
        ':idx' => $itemIndex,
        ':status' => $status,
        ':note' => $note,
        ':user' => $userId,
        ':iso' => $now,
        ':shamsi' => $now,
    ]);
}

if ($method === 'GET') {
    if ($action === 'show') {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse(['error' => 'شناسه نامعتبر است.'], 422);
        }
        $stmt = $pdo->prepare('SELECT requests.*, units.name AS unit_name, workshops.name AS workshop_name FROM requests LEFT JOIN units ON units.id = requests.requester_unit_id LEFT JOIN workshops ON workshops.id = requests.workshop_id WHERE requests.id = :id');
        $stmt->execute([':id' => $id]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$request) {
            jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
        }
        if ($auth['role'] === 'user' && $auth['unit_id'] && $request['requester_unit_id'] && (int)$request['requester_unit_id'] !== (int)$auth['unit_id']) {
            jsonResponse(['error' => 'دسترسی ندارید.'], 403);
        }
        $historyStmt = $pdo->prepare('SELECT h.*, u.username FROM history h LEFT JOIN users u ON u.id = h.user_id WHERE h.request_id = :id ORDER BY h.id DESC');
        $historyStmt->execute([':id' => $id]);
        $attachmentsStmt = $pdo->prepare('SELECT id, item_index, path, type, created_at_iso FROM attachments WHERE request_id = :id ORDER BY id DESC');
        $attachmentsStmt->execute([':id' => $id]);
        $request['items'] = json_decode($request['items_json'], true);
        $request['history'] = $historyStmt->fetchAll(PDO::FETCH_ASSOC);
        $request['attachments'] = $attachmentsStmt->fetchAll(PDO::FETCH_ASSOC);
        $request['qr_payload'] = '/requests/' . $request['id'];
        jsonResponse(['request' => $request]);
    }

    if ($action === 'report') {
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $query = 'SELECT status, COUNT(*) as total FROM requests WHERE 1=1';
        $params = [];
        if ($from) {
            $query .= ' AND created_at_iso >= :from';
            $params[':from'] = $from;
        }
        if ($to) {
            $query .= ' AND created_at_iso <= :to';
            $params[':to'] = $to;
        }
        if ($auth['role'] === 'user' && $auth['unit_id']) {
            $query .= ' AND (requester_unit_id = :unit OR requester_unit_id IS NULL)';
            $params[':unit'] = $auth['unit_id'];
        }
        $query .= ' GROUP BY status';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        jsonResponse(['report' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    $params = [];
    $query = 'SELECT requests.*, units.name AS unit_name, workshops.name AS workshop_name FROM requests LEFT JOIN units ON units.id = requests.requester_unit_id LEFT JOIN workshops ON workshops.id = requests.workshop_id WHERE 1=1';
    if ($auth['role'] === 'user' && $auth['unit_id']) {
        $query .= ' AND (requests.requester_unit_id = :unit OR requests.requester_unit_id IS NULL)';
        $params[':unit'] = $auth['unit_id'];
    }
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $query .= ' AND (requests.request_number LIKE :q OR requests.description LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    $query .= ' ORDER BY requests.created_at_iso DESC LIMIT 100';
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
        $row['items'] = json_decode($row['items_json'], true);
        $row['qr_payload'] = '/requests/' . $row['id'];
    }
    jsonResponse(['requests' => $rows]);
}

if ($method === 'POST') {
    if (!userCanEdit($auth)) {
        jsonResponse(['error' => 'دسترسی ثبت ندارید.'], 403);
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $requestNumber = trim((string)($body['request_number'] ?? ''));
    $type = (string)($body['type'] ?? 'exit');
    $unitId = $body['requester_unit_id'] ?? null;
    $workshopId = $body['workshop_id'] ?? null;
    $description = trim((string)($body['description'] ?? ''));
    $dateShamsi = trim((string)($body['date_shamsi'] ?? ''));
    $confirmDate = trim((string)($body['confirm_date_shamsi'] ?? ''));
    $items = $body['items'] ?? [];
    $items = is_array($items) ? $items : [];

    validateItems($items, 1, 5);
    $items = hydrateItems($items, $statuses);

    if ($requestNumber === '' || !in_array($type, ['exit','external','confirm'], true)) {
        jsonResponse(['error' => 'اطلاعات درخواست ناقص است.'], 422);
    }
    $now = gmdate('Y-m-d H:i:s');
    try {
        $stmt = $pdo->prepare('INSERT INTO requests (request_number, type, requester_unit_id, workshop_id, description, date_shamsi, date_iso, confirm_date_shamsi, confirm_date_iso, status, items_json, before_images_json, after_images_json, created_by, created_at_iso, created_at_shamsi, qr_code_path) VALUES (:req, :type, :unit, :workshop, :desc, :date, :dateIso, :confirm, :confirmIso, :status, :items, :before, :after, :uid, :nowIso, :nowShamsi, :qr)');
        $stmt->execute([
            ':req' => $requestNumber,
            ':type' => $type,
            ':unit' => $unitId,
            ':workshop' => $workshopId,
            ':desc' => $description,
            ':date' => $dateShamsi,
            ':dateIso' => $now,
            ':confirm' => $confirmDate ?: null,
            ':confirmIso' => $confirmDate ? $now : null,
            ':status' => $items[0]['status'] ?? 'ارسال به تعمیرگاه',
            ':items' => json_encode($items, JSON_UNESCAPED_UNICODE),
            ':before' => json_encode(array_column($items, 'beforeImages'), JSON_UNESCAPED_UNICODE),
            ':after' => json_encode(array_column($items, 'afterImages'), JSON_UNESCAPED_UNICODE),
            ':uid' => $auth['id'],
            ':nowIso' => $now,
            ':nowShamsi' => $now,
            ':qr' => '/requests/' . $requestNumber,
        ]);
    } catch (PDOException $exception) {
        if ((int)$exception->getCode() === 23000) {
            jsonResponse(['error' => 'شماره فرم تکراری است.'], 409);
        }
        throw $exception;
    }
    $requestId = (int)$pdo->lastInsertId();

    foreach ($items as $index => $item) {
        insertHistory($pdo, $requestId, $index, $item['status'], $item['note'] ?? null, (int)$auth['id']);
    }

    jsonResponse(['message' => 'درخواست ثبت شد.', 'request_id' => $requestId]);
}

if ($method === 'PUT') {
    if (!userCanEdit($auth)) {
        jsonResponse(['error' => 'دسترسی ویرایش ندارید.'], 403);
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = (int)($body['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['error' => 'شناسه نامعتبر است.'], 422);
    }
    $stmt = $pdo->prepare('SELECT * FROM requests WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$request) {
        jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
    }
    if ($auth['role'] === 'user' && $auth['unit_id'] && $request['requester_unit_id'] && (int)$request['requester_unit_id'] !== (int)$auth['unit_id']) {
        jsonResponse(['error' => 'دسترسی ندارید.'], 403);
    }
    $items = json_decode($request['items_json'], true);
    $incomingItems = hydrateItems($body['items'] ?? $items, $statuses);
    validateItems($incomingItems, 1, 5);
    $note = trim((string)($body['note'] ?? ''));
    $status = (string)($body['status'] ?? $request['status']);
    if (!in_array($status, $statuses, true)) {
        $status = $request['status'];
    }
    $now = gmdate('Y-m-d H:i:s');
    $stmt = $pdo->prepare('UPDATE requests SET description = :desc, status = :status, items_json = :items, before_images_json = :before, after_images_json = :after, confirm_date_shamsi = :confirm, confirm_date_iso = :confirmIso, updated_by = :uid, updated_at_iso = :nowIso, updated_at_shamsi = :nowShamsi WHERE id = :id');
    $stmt->execute([
        ':desc' => trim((string)($body['description'] ?? $request['description'])),
        ':status' => $status,
        ':items' => json_encode($incomingItems, JSON_UNESCAPED_UNICODE),
        ':before' => json_encode(array_column($incomingItems, 'beforeImages'), JSON_UNESCAPED_UNICODE),
        ':after' => json_encode(array_column($incomingItems, 'afterImages'), JSON_UNESCAPED_UNICODE),
        ':confirm' => $body['confirm_date_shamsi'] ?? $request['confirm_date_shamsi'],
        ':confirmIso' => $body['confirm_date_shamsi'] ? $now : $request['confirm_date_iso'],
        ':uid' => $auth['id'],
        ':nowIso' => $now,
        ':nowShamsi' => $now,
        ':id' => $id,
    ]);

    foreach ($incomingItems as $index => $item) {
        $prevStatus = $items[$index]['status'] ?? null;
        if ($prevStatus !== $item['status'] || $note !== '') {
            insertHistory($pdo, $id, $index, $item['status'], $note ?: ($item['note'] ?? null), (int)$auth['id']);
        }
    }

    jsonResponse(['message' => 'درخواست به‌روزرسانی شد.']);
}

jsonResponse(['error' => 'متد پشتیبانی نمی‌شود.'], 405);
