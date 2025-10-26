<?php
/**
 * Database Initialization Script
 * Creates SQLite database with all required tables and default admin user
 */

$dbFile = __DIR__ . '/cmms.db';

// Remove existing database if present
if (file_exists($dbFile)) {
    unlink($dbFile);
    echo "Removed existing database.\n";
}

try {
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Creating database schema...\n";
    
    // Users table
    $db->exec("
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('manager', 'storekeeper', 'unit', 'workshop')),
            unit_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id)
        )
    ");
    echo "✓ Created users table\n";
    
    // Tokens table
    $db->exec("
        CREATE TABLE tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✓ Created tokens table\n";
    
    // Units table
    $db->exec("
        CREATE TABLE units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created units table\n";
    
    // Equipment table
    $db->exec("
        CREATE TABLE equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT,
            unit_id INTEGER,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id)
        )
    ");
    echo "✓ Created equipment table\n";
    
    // Exit forms table
    $db->exec("
        CREATE TABLE exit_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_no TEXT UNIQUE NOT NULL,
            date_shamsi TEXT NOT NULL,
            out_type TEXT,
            driver_name TEXT,
            reason TEXT,
            unit_id INTEGER,
            status TEXT DEFAULT 'در حال ارسال',
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ");
    echo "✓ Created exit_forms table\n";
    
    // Exit items table
    $db->exec("
        CREATE TABLE exit_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exit_form_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            code TEXT,
            quantity REAL NOT NULL CHECK(quantity > 0),
            unit TEXT NOT NULL,
            equipment_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (exit_form_id) REFERENCES exit_forms(id) ON DELETE CASCADE,
            FOREIGN KEY (equipment_id) REFERENCES equipment(id)
        )
    ");
    echo "✓ Created exit_items table\n";
    
    // Repair forms table
    $db->exec("
        CREATE TABLE repair_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_no TEXT UNIQUE NOT NULL,
            unit_id INTEGER,
            date_shamsi TEXT NOT NULL,
            description TEXT,
            reference_exit_form_id INTEGER,
            status TEXT DEFAULT 'در حال تعمیر',
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (unit_id) REFERENCES units(id),
            FOREIGN KEY (reference_exit_form_id) REFERENCES exit_forms(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ");
    echo "✓ Created repair_forms table\n";
    
    // Repair items table
    $db->exec("
        CREATE TABLE repair_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repair_form_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            code TEXT,
            quantity REAL NOT NULL CHECK(quantity > 0),
            unit TEXT NOT NULL,
            equipment_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (repair_form_id) REFERENCES repair_forms(id) ON DELETE CASCADE,
            FOREIGN KEY (equipment_id) REFERENCES equipment(id)
        )
    ");
    echo "✓ Created repair_items table\n";
    
    // Entry confirmations table
    $db->exec("
        CREATE TABLE entry_confirms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            confirm_no TEXT UNIQUE NOT NULL,
            purchase_date_shamsi TEXT,
            purchase_center TEXT,
            purchase_request_code TEXT,
            buyer_name TEXT,
            driver_name TEXT,
            reference_exit_form_id INTEGER,
            reference_repair_form_id INTEGER,
            status TEXT DEFAULT 'تحویل به معدن',
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reference_exit_form_id) REFERENCES exit_forms(id),
            FOREIGN KEY (reference_repair_form_id) REFERENCES repair_forms(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ");
    echo "✓ Created entry_confirms table\n";
    
    // Entry items table
    $db->exec("
        CREATE TABLE entry_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_confirm_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            code TEXT,
            quantity REAL NOT NULL CHECK(quantity > 0),
            unit TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_confirm_id) REFERENCES entry_confirms(id) ON DELETE CASCADE
        )
    ");
    echo "✓ Created entry_items table\n";
    
    // Attachments table
    $db->exec("
        CREATE TABLE attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created attachments table\n";
    
    // Insert sample units
    $db->exec("
        INSERT INTO units (name) VALUES 
        ('واحد تولید'),
        ('واحد نگهداری'),
        ('واحد حمل و نقل'),
        ('واحد تعمیرات')
    ");
    echo "✓ Inserted sample units\n";
    
    // Create default admin user: admin / admin123
    $passwordHash = password_hash('admin123', PASSWORD_BCRYPT);
    $stmt = $db->prepare("INSERT INTO users (username, password_hash, role, unit_id) VALUES (?, ?, ?, ?)");
    $stmt->execute(['admin', $passwordHash, 'manager', null]);
    echo "✓ Created default admin user (username: admin, password: admin123)\n";
    
    // Create sample users for different roles
    $stmt->execute(['storekeeper1', password_hash('pass123', PASSWORD_BCRYPT), 'storekeeper', null]);
    $stmt->execute(['unit1', password_hash('pass123', PASSWORD_BCRYPT), 'unit', 1]);
    $stmt->execute(['workshop1', password_hash('pass123', PASSWORD_BCRYPT), 'workshop', 4]);
    echo "✓ Created sample users for testing\n";
    
    echo "\n✅ Database initialized successfully!\n";
    echo "Database file: $dbFile\n";
    echo "\nDefault credentials:\n";
    echo "  Username: admin\n";
    echo "  Password: admin123\n";
    echo "  Role: manager\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
