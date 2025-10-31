<?php
/**
 * history.php
 * بازیابی تاریخچه وضعیت اقلام.
 */

declare(strict_types=1);

require_once __DIR__ . '/../db.php';

$pdo = getPDO();
$auth = requireAuth();

$requestId = (int)($_GET['request_id'] ?? 0);
if ($requestId <= 0) {
    jsonResponse(['error' => 'شناسه درخواست الزامی است.'], 422);
}

$stmt = $pdo->prepare('SELECT r.requester_unit_id FROM requests r WHERE r.id = :id');
$stmt->execute([':id' => $requestId]);
$request = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$request) {
    jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
}
if ($auth['role'] === 'user' && $auth['unit_id'] && $request['requester_unit_id'] && (int)$request['requester_unit_id'] !== (int)$auth['unit_id']) {
    jsonResponse(['error' => 'دسترسی ندارید.'], 403);
}

$params = [':id' => $requestId];
$query = 'SELECT h.*, u.username FROM history h LEFT JOIN users u ON u.id = h.user_id WHERE h.request_id = :id';
$item = $_GET['item_index'] ?? null;
if ($item !== null) {
    $query .= ' AND h.item_index = :item';
    $params[':item'] = (int)$item;
}
$query .= ' ORDER BY h.id DESC';
$stmt = $pdo->prepare($query);
$stmt->execute($params);
jsonResponse(['history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
