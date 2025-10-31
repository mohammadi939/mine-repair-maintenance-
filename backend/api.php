<?php
/**
 * Main API Endpoint Handler
 * Handles all API requests with authentication and role-based access control
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dbFile = __DIR__ . '/cmms.db';
$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Helper functions
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

function requireAuth($db) {
    $token = getAuthToken();
    if (!$token) {
        sendError('توکن احراز هویت الزامی است', 401);
    }
    
    $user = validateToken($db, $token);
    if (!$user) {
        sendError('توکن نامعتبر یا منقضی شده است', 401);
    }
    
    return $user;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

function canAccessUnit($user, $unitId) {
    if ($user['role'] === 'manager' || $user['role'] === 'storekeeper') {
        return true;
    }
    if ($user['role'] === 'unit' && $user['unit_id'] == $unitId) {
        return true;
    }
    return false;
}

function resolveEntityUnit($db, $entityType, $entityId) {
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
            $stmt = $db->prepare(<<<SQL
                SELECT
                    rf.unit_id,
                    ef.unit_id AS reference_exit_unit_id
                FROM repair_forms rf
                LEFT JOIN exit_forms ef ON ef.id = rf.reference_exit_form_id
                WHERE rf.id = ?
            SQL);
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
            $stmt = $db->prepare(<<<SQL
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
            SQL);
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

// Get action from query string
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Public endpoints
    if ($action === 'login' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        
        if (!$username || !$password) {
            sendError('نام کاربری و رمز عبور الزامی است');
        }
        
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            sendError('نام کاربری یا رمز عبور اشتباه است', 401);
        }
        
        // Generate token
        $token = generateToken();
        $expiresAt = date('Y-m-d H:i:s', time() + 86400); // 24 hours
        
        $stmt = $db->prepare("INSERT INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$token, $user['id'], $expiresAt]);
        
        sendJson([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'unit_id' => $user['unit_id']
            ]
        ]);
    }
    
    // Protected endpoints - require authentication
    $user = requireAuth($db);
    
    if ($action === 'me' && $method === 'GET') {
        sendJson([
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'unit_id' => $user['unit_id']
        ]);
    }
    
    if ($action === 'logout' && $method === 'POST') {
        $token = getAuthToken();
        $stmt = $db->prepare("DELETE FROM tokens WHERE token = ?");
        $stmt->execute([$token]);
        sendJson(['message' => 'خروج موفقیت‌آمیز']);
    }
    
    // Get units
    if ($action === 'units' && $method === 'GET') {
        $stmt = $db->query("SELECT * FROM units ORDER BY name");
        sendJson($stmt->fetchAll());
    }
    
    // Create exit form
    if ($action === 'create_exit_form' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['form_no'])) {
            sendError('شماره فرم الزامی است');
        }
        if (empty($data['date_shamsi'])) {
            sendError('تاریخ الزامی است');
        }
        if (empty($data['items']) || !is_array($data['items'])) {
            sendError('اقلام الزامی است');
        }
        if (count($data['items']) < 1 || count($data['items']) > 5) {
            sendError('تعداد اقلام باید بین ۱ تا ۵ باشد');
        }
        
        // Validate each item
        foreach ($data['items'] as $item) {
            if (empty($item['description'])) {
                sendError('شرح کالا الزامی است');
            }
            if (empty($item['quantity']) || $item['quantity'] <= 0) {
                sendError('تعداد باید بزرگتر از صفر باشد');
            }
            if (empty($item['unit'])) {
                sendError('واحد الزامی است');
            }
        }
        
        // Check access
        if (!canAccessUnit($user, $data['unit_id'])) {
            sendError('دسترسی به این واحد ندارید', 403);
        }
        
        // Begin transaction
        $db->beginTransaction();
        
        try {
            // Insert exit form
            $stmt = $db->prepare("
                INSERT INTO exit_forms (form_no, date_shamsi, out_type, driver_name, reason, unit_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['form_no'],
                $data['date_shamsi'],
                $data['out_type'] ?? null,
                $data['driver_name'] ?? null,
                $data['reason'] ?? null,
                $data['unit_id'] ?? null,
                $user['id']
            ]);
            
            $exitFormId = $db->lastInsertId();
            
            // Insert items
            $stmt = $db->prepare("
                INSERT INTO exit_items (exit_form_id, description, code, quantity, unit, equipment_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($data['items'] as $item) {
                $stmt->execute([
                    $exitFormId,
                    $item['description'],
                    $item['code'] ?? null,
                    $item['quantity'],
                    $item['unit'],
                    $item['equipment_id'] ?? null
                ]);
            }
            
            $db->commit();
            
            sendJson([
                'message' => 'فرم خروج با موفقیت ثبت شد',
                'id' => $exitFormId,
                'form_no' => $data['form_no']
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                sendError('شماره فرم تکراری است');
            }
            throw $e;
        }
    }
    
    // Create repair form
    if ($action === 'create_repair_form' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['form_no'])) {
            sendError('شماره فرم الزامی است');
        }
        if (empty($data['date_shamsi'])) {
            sendError('تاریخ الزامی است');
        }
        
        // Validate items if provided
        if (!empty($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                if (empty($item['description'])) {
                    sendError('شرح کالا الزامی است');
                }
                if (empty($item['quantity']) || $item['quantity'] <= 0) {
                    sendError('تعداد باید بزرگتر از صفر باشد');
                }
                if (empty($item['unit'])) {
                    sendError('واحد الزامی است');
                }
            }
        }
        
        // Check access
        if (!canAccessUnit($user, $data['unit_id'])) {
            sendError('دسترسی به این واحد ندارید', 403);
        }
        
        $db->beginTransaction();
        
        try {
            // Get reference exit form ID if form_no provided
            $referenceExitFormId = null;
            if (!empty($data['reference_exit_form_no'])) {
                $stmt = $db->prepare("SELECT id FROM exit_forms WHERE form_no = ?");
                $stmt->execute([$data['reference_exit_form_no']]);
                $ref = $stmt->fetch();
                if ($ref) {
                    $referenceExitFormId = $ref['id'];
                    // Update exit form status
                    $stmt = $db->prepare("UPDATE exit_forms SET status = 'در حال تعمیر' WHERE id = ?");
                    $stmt->execute([$referenceExitFormId]);
                }
            }
            
            // Insert repair form
            $stmt = $db->prepare("
                INSERT INTO repair_forms (form_no, unit_id, date_shamsi, description, reference_exit_form_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['form_no'],
                $data['unit_id'] ?? null,
                $data['date_shamsi'],
                $data['description'] ?? null,
                $referenceExitFormId,
                $user['id']
            ]);
            
            $repairFormId = $db->lastInsertId();
            
            // Insert items if provided
            if (!empty($data['items']) && is_array($data['items'])) {
                $stmt = $db->prepare("
                    INSERT INTO repair_items (repair_form_id, description, code, quantity, unit, equipment_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                
                foreach ($data['items'] as $item) {
                    $stmt->execute([
                        $repairFormId,
                        $item['description'],
                        $item['code'] ?? null,
                        $item['quantity'],
                        $item['unit'],
                        $item['equipment_id'] ?? null
                    ]);
                }
            }
            
            $db->commit();
            
            sendJson([
                'message' => 'فرم تعمیر با موفقیت ثبت شد',
                'id' => $repairFormId,
                'form_no' => $data['form_no']
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                sendError('شماره فرم تکراری است');
            }
            throw $e;
        }
    }
    
    // Create entry confirmation
    if ($action === 'create_entry_confirm' && $method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($data['confirm_no'])) {
            sendError('شماره تأیید الزامی است');
        }
        if (empty($data['items']) || !is_array($data['items'])) {
            sendError('اقلام الزامی است');
        }
        if (count($data['items']) < 1 || count($data['items']) > 11) {
            sendError('تعداد اقلام باید بین ۱ تا ۱۱ باشد');
        }
        
        // Validate each item
        foreach ($data['items'] as $item) {
            if (empty($item['description'])) {
                sendError('شرح کالا الزامی است');
            }
            if (empty($item['quantity']) || $item['quantity'] <= 0) {
                sendError('تعداد باید بزرگتر از صفر باشد');
            }
            if (empty($item['unit'])) {
                sendError('واحد الزامی است');
            }
        }
        
        $db->beginTransaction();
        
        try {
            // Get reference IDs
            $referenceExitFormId = null;
            $referenceRepairFormId = null;
            
            if (!empty($data['reference_exit_form_no'])) {
                $stmt = $db->prepare("SELECT id FROM exit_forms WHERE form_no = ?");
                $stmt->execute([$data['reference_exit_form_no']]);
                $ref = $stmt->fetch();
                if ($ref) {
                    $referenceExitFormId = $ref['id'];
                    // Update status
                    $stmt = $db->prepare("UPDATE exit_forms SET status = 'تحویل به معدن' WHERE id = ?");
                    $stmt->execute([$referenceExitFormId]);
                }
            }
            
            if (!empty($data['reference_repair_form_no'])) {
                $stmt = $db->prepare("SELECT id FROM repair_forms WHERE form_no = ?");
                $stmt->execute([$data['reference_repair_form_no']]);
                $ref = $stmt->fetch();
                if ($ref) {
                    $referenceRepairFormId = $ref['id'];
                    // Update status
                    $stmt = $db->prepare("UPDATE repair_forms SET status = 'تعمیر شده' WHERE id = ?");
                    $stmt->execute([$referenceRepairFormId]);
                }
            }
            
            // Insert entry confirmation
            $stmt = $db->prepare("
                INSERT INTO entry_confirms 
                (confirm_no, purchase_date_shamsi, purchase_center, purchase_request_code, 
                 buyer_name, driver_name, reference_exit_form_id, reference_repair_form_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['confirm_no'],
                $data['purchase_date_shamsi'] ?? null,
                $data['purchase_center'] ?? null,
                $data['purchase_request_code'] ?? null,
                $data['buyer_name'] ?? null,
                $data['driver_name'] ?? null,
                $referenceExitFormId,
                $referenceRepairFormId,
                $user['id']
            ]);
            
            $entryConfirmId = $db->lastInsertId();
            
            // Insert items
            $stmt = $db->prepare("
                INSERT INTO entry_items (entry_confirm_id, description, code, quantity, unit)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            foreach ($data['items'] as $item) {
                $stmt->execute([
                    $entryConfirmId,
                    $item['description'],
                    $item['code'] ?? null,
                    $item['quantity'],
                    $item['unit']
                ]);
            }
            
            $db->commit();
            
            sendJson([
                'message' => 'تأیید ورود با موفقیت ثبت شد',
                'id' => $entryConfirmId,
                'confirm_no' => $data['confirm_no']
            ]);
            
        } catch (Exception $e) {
            $db->rollBack();
            if (strpos($e->getMessage(), 'UNIQUE constraint failed') !== false) {
                sendError('شماره تأیید تکراری است');
            }
            throw $e;
        }
    }
    
    // Search forms
    if ($action === 'search_forms' && $method === 'GET') {
        $query = $_GET['q'] ?? '';
        
        if (empty($query)) {
            sendJson([]);
        }
        
        $results = [];
        
        // Search exit forms
        $stmt = $db->prepare("
            SELECT 'exit' as type, id, form_no as number, date_shamsi, status, unit_id
            FROM exit_forms 
            WHERE form_no LIKE ?
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $stmt->execute(['%' . $query . '%']);
        $exitForms = $stmt->fetchAll();
        
        // Search repair forms
        $stmt = $db->prepare("
            SELECT 'repair' as type, id, form_no as number, date_shamsi, status, unit_id
            FROM repair_forms 
            WHERE form_no LIKE ?
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $stmt->execute(['%' . $query . '%']);
        $repairForms = $stmt->fetchAll();
        
        // Filter based on user role
        foreach ($exitForms as $form) {
            if (canAccessUnit($user, $form['unit_id'])) {
                $results[] = $form;
            }
        }
        
        foreach ($repairForms as $form) {
            if (canAccessUnit($user, $form['unit_id'])) {
                $results[] = $form;
            }
        }
        
        sendJson($results);
    }
    
    // Get form details
    if ($action === 'get_form_details' && $method === 'GET') {
        $type = $_GET['type'] ?? '';
        $id = $_GET['id'] ?? '';

        if (!$type || !$id) {
            sendError('نوع و شناسه فرم الزامی است');
        }
        
        if ($type === 'exit') {
            $stmt = $db->prepare("
                SELECT ef.*, u.name as unit_name
                FROM exit_forms ef
                LEFT JOIN units u ON ef.unit_id = u.id
                WHERE ef.id = ?
            ");
            $stmt->execute([$id]);
            $form = $stmt->fetch();
            
            if (!$form) {
                sendError('فرم یافت نشد', 404);
            }
            
            if (!canAccessUnit($user, $form['unit_id'])) {
                sendError('دسترسی به این فرم ندارید', 403);
            }
            
            $stmt = $db->prepare("SELECT * FROM exit_items WHERE exit_form_id = ?");
            $stmt->execute([$id]);
            $form['items'] = $stmt->fetchAll();
            
            sendJson($form);
            
        } elseif ($type === 'repair') {
            $stmt = $db->prepare("
                SELECT rf.*, u.name as unit_name, ef.form_no as reference_exit_form_no
                FROM repair_forms rf
                LEFT JOIN units u ON rf.unit_id = u.id
                LEFT JOIN exit_forms ef ON rf.reference_exit_form_id = ef.id
                WHERE rf.id = ?
            ");
            $stmt->execute([$id]);
            $form = $stmt->fetch();
            
            if (!$form) {
                sendError('فرم یافت نشد', 404);
            }
            
            if (!canAccessUnit($user, $form['unit_id'])) {
                sendError('دسترسی به این فرم ندارید', 403);
            }
            
            $stmt = $db->prepare("SELECT * FROM repair_items WHERE repair_form_id = ?");
            $stmt->execute([$id]);
            $form['items'] = $stmt->fetchAll();
            
            sendJson($form);
        } else {
            sendError('نوع فرم نامعتبر است');
        }
    }

    if ($action === 'get_attachments' && $method === 'GET') {
        $entityType = $_GET['entity_type'] ?? '';
        $entityId = $_GET['entity_id'] ?? '';

        if (!$entityType || !$entityId) {
            sendError('نوع و شناسه موجودیت الزامی است');
        }

        if (!ctype_digit((string) $entityId)) {
            sendError('شناسه موجودیت نامعتبر است');
        }

        $entityId = (int) $entityId;

        $allowedTypes = ['exit_form', 'repair_form', 'entry_confirm', 'equipment'];
        if (!in_array($entityType, $allowedTypes, true)) {
            sendError('نوع موجودیت نامعتبر است');
        }

        $unitId = resolveEntityUnit($db, $entityType, $entityId);
        if (!canAccessUnit($user, $unitId)) {
            sendError('دسترسی به این موجودیت ندارید', 403);
        }

        $stmt = $db->prepare(
            "SELECT id, file_path, file_name, created_at\n"
            . "FROM attachments\n"
            . "WHERE entity_type = ? AND entity_id = ?\n"
            . "ORDER BY created_at DESC, id DESC"
        );
        $stmt->execute([$entityType, $entityId]);

        sendJson($stmt->fetchAll());
    }
    
    // Get recent forms
    if ($action === 'recent_forms' && $method === 'GET') {
        $limit = $_GET['limit'] ?? 10;
        
        $whereClause = '';
        $params = [];
        
        if ($user['role'] === 'unit') {
            $whereClause = 'WHERE unit_id = ?';
            $params[] = $user['unit_id'];
        }
        
        // Get exit forms
        $stmt = $db->prepare("
            SELECT 'exit' as type, id, form_no as number, date_shamsi, status, unit_id, created_at
            FROM exit_forms 
            $whereClause
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $params[] = $limit;
        $stmt->execute($params);
        $exitForms = $stmt->fetchAll();
        
        // Get repair forms
        $params = [];
        if ($user['role'] === 'unit') {
            $params[] = $user['unit_id'];
        }
        $params[] = $limit;
        
        $stmt = $db->prepare("
            SELECT 'repair' as type, id, form_no as number, date_shamsi, status, unit_id, created_at
            FROM repair_forms 
            $whereClause
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $stmt->execute($params);
        $repairForms = $stmt->fetchAll();
        
        $allForms = array_merge($exitForms, $repairForms);
        usort($allForms, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });
        
        sendJson(array_slice($allForms, 0, $limit));
    }
    
    // Get all statuses
    if ($action === 'all_statuses' && $method === 'GET') {
        $whereClause = '';
        $params = [];
        
        if ($user['role'] === 'unit') {
            $whereClause = 'WHERE unit_id = ?';
            $params[] = $user['unit_id'];
        }
        
        // Get exit forms with details
        $stmt = $db->prepare("
            SELECT 
                'exit' as type,
                ef.id,
                ef.form_no,
                ef.date_shamsi,
                ef.status,
                ef.unit_id,
                u.name as unit_name,
                ef.created_at
            FROM exit_forms ef
            LEFT JOIN units u ON ef.unit_id = u.id
            $whereClause
            ORDER BY ef.created_at DESC
        ");
        $stmt->execute($params);
        $exitForms = $stmt->fetchAll();
        
        // Get repair forms
        $stmt = $db->prepare("
            SELECT 
                'repair' as type,
                rf.id,
                rf.form_no,
                rf.date_shamsi,
                rf.status,
                rf.unit_id,
                u.name as unit_name,
                ef.form_no as reference_exit_form_no,
                rf.created_at
            FROM repair_forms rf
            LEFT JOIN units u ON rf.unit_id = u.id
            LEFT JOIN exit_forms ef ON rf.reference_exit_form_id = ef.id
            $whereClause
            ORDER BY rf.created_at DESC
        ");
        $stmt->execute($params);
        $repairForms = $stmt->fetchAll();
        
        // Get entry confirms
        $stmt = $db->query("
            SELECT 
                'entry' as type,
                ec.id,
                ec.confirm_no as form_no,
                ec.purchase_date_shamsi as date_shamsi,
                ec.status,
                ef.unit_id,
                u.name as unit_name,
                ef.form_no as reference_exit_form_no,
                rf.form_no as reference_repair_form_no,
                ec.created_at
            FROM entry_confirms ec
            LEFT JOIN exit_forms ef ON ec.reference_exit_form_id = ef.id
            LEFT JOIN repair_forms rf ON ec.reference_repair_form_id = rf.id
            LEFT JOIN units u ON ef.unit_id = u.id
            ORDER BY ec.created_at DESC
        ");
        $entryConfirms = $stmt->fetchAll();
        
        // Filter entry confirms for unit role
        if ($user['role'] === 'unit') {
            $entryConfirms = array_filter($entryConfirms, function($ec) use ($user) {
                return $ec['unit_id'] == $user['unit_id'];
            });
            $entryConfirms = array_values($entryConfirms);
        }
        
        $allStatuses = array_merge($exitForms, $repairForms, $entryConfirms);
        usort($allStatuses, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });
        
        sendJson($allStatuses);
    }
    
    sendError('اکشن نامعتبر یا متد HTTP پشتیبانی نمی‌شود', 404);
    
} catch (PDOException $e) {
    sendError('خطای پایگاه داده: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError('خطای سرور: ' . $e->getMessage(), 500);
}
