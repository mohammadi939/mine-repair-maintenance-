<?php
/**
 * init_db.php
 * اسکریپت ایجاد جداول پایگاه‌داده و درج کاربر پیش‌فرض.
 */

declare(strict_types=1);

function runMigrations(PDO $pdo, bool $seed = false): void {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $schema = [
        'CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ("admin", "user", "viewer")),
            unit_id INTEGER,
            created_at_iso TEXT NOT NULL,
            created_at_shamsi TEXT NOT NULL
        )',
        'CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at_iso TEXT NOT NULL,
            created_at_iso TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )',
        'CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at_iso TEXT NOT NULL
        )',
        'CREATE TABLE IF NOT EXISTS workshops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at_iso TEXT NOT NULL
        )',
        'CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            serial TEXT,
            unit_id INTEGER,
            created_at_iso TEXT NOT NULL,
            FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE SET NULL
        )',
        'CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_number TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL CHECK(type IN ("exit", "external", "confirm")),
            requester_unit_id INTEGER,
            workshop_id INTEGER,
            description TEXT,
            date_shamsi TEXT,
            date_iso TEXT,
            confirm_date_shamsi TEXT,
            confirm_date_iso TEXT,
            status TEXT NOT NULL DEFAULT "ارسال به تعمیرگاه",
            items_json TEXT NOT NULL,
            before_images_json TEXT,
            after_images_json TEXT,
            qr_code_path TEXT,
            created_by INTEGER NOT NULL,
            updated_by INTEGER,
            created_at_iso TEXT NOT NULL,
            created_at_shamsi TEXT NOT NULL,
            updated_at_iso TEXT,
            updated_at_shamsi TEXT,
            FOREIGN KEY(requester_unit_id) REFERENCES units(id) ON DELETE SET NULL,
            FOREIGN KEY(workshop_id) REFERENCES workshops(id) ON DELETE SET NULL,
            FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
        )',
        'CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            item_index INTEGER NOT NULL,
            status TEXT NOT NULL,
            note TEXT,
            user_id INTEGER,
            timestamp_iso TEXT NOT NULL,
            timestamp_shamsi TEXT NOT NULL,
            FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        )',
        'CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER,
            item_index INTEGER,
            path TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at_iso TEXT NOT NULL,
            FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
        )'
    ];

    foreach ($schema as $sql) {
        $pdo->exec($sql);
    }

    if ($seed) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM users');
        $stmt->execute();
        $count = (int)$stmt->fetchColumn();
        if ($count === 0) {
            $password = password_hash('admin123', PASSWORD_DEFAULT);
            $now = gmdate('Y-m-d H:i:s');
            $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role, unit_id, created_at_iso, created_at_shamsi) VALUES (:username, :hash, "admin", NULL, :iso, :shamsi)');
            $stmt->execute([
                ':username' => 'admin',
                ':hash' => $password,
                ':iso' => $now,
                ':shamsi' => $now,
            ]);
        }
    }
}

if (php_sapi_name() === 'cli') {
    $dbFile = __DIR__ . '/database.sqlite';
    $needSeed = !file_exists($dbFile);
    $pdo = new PDO('sqlite:' . $dbFile);
    runMigrations($pdo, true);
    echo "پایگاه‌داده آماده شد." . PHP_EOL;
}
