# سامانه مدیریت تعمیرات معدن (CMMS)
# Mine Maintenance Management System

یک سیستم کامل مدیریت تعمیرات و نگهداری با پشتیبانی کامل از زبان فارسی، تاریخ شمسی و رابط کاربری راست‌به‌چپ.

A complete Computerized Maintenance Management System (CMMS) with full Persian/Farsi support, Jalali calendar, and RTL UI.

---

## 📋 فهرست مطالب / Table of Contents

- [ویژگی‌ها / Features](#features)
- [پیش‌نیازها / Prerequisites](#prerequisites)
- [نصب و راه‌اندازی / Installation](#installation)
- [راهنمای استفاده / Usage Guide](#usage)
- [ساختار پروژه / Project Structure](#structure)
- [API Documentation](#api)

---

## ✨ ویژگی‌ها / Features <a name="features"></a>

### فارسی:
- ✅ رابط کاربری کاملاً فارسی و راست‌به‌چپ (RTL)
- ✅ انتخابگر تاریخ شمسی گرافیکی با اعداد فارسی
- ✅ سیستم احراز هویت با توکن Bearer (انقضای ۲۴ ساعته)
- ✅ چهار نقش کاربری: مدیر، انباردار، واحد، کارگاه
- ✅ فرم‌های خروج (۱-۵ آیتم)، تعمیر، و تأیید ورود (۱-۱۱ آیتم)
- ✅ شماره‌گذاری یکتای فرم‌ها
- ✅ جستجو و ارجاع بین فرم‌ها
- ✅ نمایش وضعیت‌ها با رنگ‌بندی (آبی/نارنجی/سبز/بنفش)
- ✅ آپلود فایل و تصویر
- ✅ کنترل دسترسی بر اساس نقش و واحد
- ✅ اعتبارسنجی کامل در سمت سرور و کلاینت

### English:
- ✅ Fully Persian/Farsi UI with RTL support
- ✅ Graphical Jalali (Persian) date picker with Persian numerals
- ✅ Bearer token authentication (24-hour expiration)
- ✅ Four user roles: Manager, Storekeeper, Unit, Workshop
- ✅ Exit forms (1-5 items), Repair forms, Entry confirmations (1-11 items)
- ✅ Unique form numbering system
- ✅ Search and cross-reference between forms
- ✅ Color-coded status display (Blue/Orange/Green/Purple)
- ✅ File and image upload capability
- ✅ Role and unit-based access control
- ✅ Complete server-side and client-side validation

---

## 🔧 پیش‌نیازها / Prerequisites <a name="prerequisites"></a>

### Windows:
```bash
# PHP 8.0 or higher
# Download from: https://windows.php.net/download/

# Node.js 16+ and npm
# Download from: https://nodejs.org/

# Check versions:
php -v
node -v
npm -v
```

### Linux:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install php8.1 php8.1-sqlite3 php8.1-mbstring
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Check versions:
php -v
node -v
npm -v
```

---

## 🚀 نصب و راه‌اندازی / Installation & Setup <a name="installation"></a>

### مرحله ۱: آماده‌سازی دیتابیس / Step 1: Initialize Database

```bash
# Navigate to backend directory
cd backend

# Run database initialization (creates cmms.db)
php init_db.php
```

**خروجی موردانتظار / Expected output:**
```
Creating database schema...
✓ Created users table
✓ Created tokens table
...
✅ Database initialized successfully!

Default credentials:
  Username: admin
  Password: admin123
  Role: manager
```

### مرحله ۲: راه‌اندازی Backend / Step 2: Start Backend Server

```bash
# در دایرکتوری backend / In backend directory
php -S localhost:8000
```

**سرور در آدرس زیر در دسترس است:**
```
http://localhost:8000
```

### مرحله ۳: نصب وابستگی‌های Frontend / Step 3: Install Frontend Dependencies

```bash
# باز کردن ترمینال جدید / Open a new terminal
cd frontend

# نصب وابستگی‌ها / Install dependencies
npm install
```

### مرحله ۴: راه‌اندازی Frontend / Step 4: Start Frontend

```bash
# در دایرکتوری frontend / In frontend directory
npm start
```

**برنامه در آدرس زیر باز می‌شود:**
```
http://localhost:3000
```

---

## 📖 راهنمای استفاده / Usage Guide <a name="usage"></a>

### حساب‌های کاربری پیش‌فرض / Default User Accounts

| نقش / Role | نام کاربری / Username | رمز عبور / Password | دسترسی / Access |
|-----------|----------------------|-------------------|-----------------|
| مدیر / Manager | admin | admin123 | دسترسی کامل / Full access |
| انباردار / Storekeeper | storekeeper1 | pass123 | ثبت/مشاهده فرم‌ها / Create/view forms |
| واحد / Unit | unit1 | pass123 | فرم‌های واحد خود / Own unit forms only |
| کارگاه / Workshop | workshop1 | pass123 | ارجاعات تعمیر / Repair assignments |

### جریان کاری / Workflow

#### 1️⃣ ثبت فرم خروج / Exit Form Submission
1. وارد بخش "خروج/تعمیر" شوید / Navigate to "Exit/Repair"
2. فرم خروج را تکمیل کنید (شماره، تاریخ، اقلام ۱-۵) / Fill exit form (number, date, items 1-5)
3. "ذخیره و ادامه به فرم تعمیر" را بزنید / Click "Save and Continue to Repair Form"

#### 2️⃣ ثبت فرم تعمیر / Repair Form Submission
1. فرم تعمیر به‌طور خودکار با ارجاع به فرم خروج نمایش داده می‌شود
2. شرح مشکل و اقلام (اختیاری) را تکمیل کنید / Fill description and optional items
3. "ذخیره فرم تعمیر" را بزنید / Click "Save Repair Form"

#### 3️⃣ تأیید ورود / Entry Confirmation
1. وارد بخش "تأیید ورود" شوید / Navigate to "Entry Confirmation"
2. شماره فرم خروج/تعمیر را جستجو کنید / Search for exit/repair form number
3. فرم مناسب را انتخاب کنید / Select appropriate form
4. اطلاعات تأیید ورود و اقلام (۱-۱۱) را تکمیل کنید / Fill confirmation details and items (1-11)
5. "ذخیره تأیید ورود" را بزنید / Click "Save Entry Confirmation"

#### 4️⃣ مشاهده وضعیت‌ها / View Statuses
1. وارد بخش "وضعیت‌ها" شوید / Navigate to "Statuses"
2. فیلتر بر اساس نوع یا وضعیت / Filter by type or status
3. مشاهده تجمیعی تمام فرم‌ها با رنگ‌بندی / View all forms with color coding

### راهنمای رنگ‌های وضعیت / Status Color Guide

| وضعیت / Status | رنگ / Color | توضیح / Description |
|---------------|-------------|-------------------|
| در حال ارسال | 🔵 آبی / Blue | ارسال شده برای تعمیر / Sent for repair |
| در حال تعمیر | 🟠 نارنجی / Orange | در حال تعمیر / Under repair |
| تعمیر شده | 🟢 سبز / Green | تعمیر تکمیل شده / Repair completed |
| تحویل به معدن | 🟣 بنفش / Purple | تحویل داده شده / Delivered to mine |

---

## 📁 ساختار پروژه / Project Structure <a name="structure"></a>

```
/workspace/
├── backend/
│   ├── init_db.php          # Database initialization script
│   ├── api.php              # Main API endpoint handler
│   ├── upload.php           # File upload handler
│   └── cmms.db             # SQLite database (created after init)
│
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML template with RTL
│   ├── src/
│   │   ├── api.js          # API client with axios
│   │   ├── utils.js        # Utility functions (Persian numbers, etc.)
│   │   ├── AuthContext.js  # Authentication context
│   │   ├── App.js          # Main app with routing
│   │   ├── index.js        # React entry point
│   │   ├── index.css       # TailwindCSS + custom styles
│   │   ├── components/
│   │   │   ├── Login.js    # Login component
│   │   │   └── Layout.js   # Main layout with navigation
│   │   └── pages/
│   │       ├── Dashboard.js         # Dashboard page
│   │       ├── ExitRepairForm.js    # Exit/Repair forms
│   │       ├── EntryConfirmForm.js  # Entry confirmation
│   │       └── StatusesView.js      # Status overview
│   ├── package.json
│   └── tailwind.config.js
│
├── uploads/                # Uploaded files directory
└── README.md              # This file
```

---

## 🔌 API Documentation <a name="api"></a>

### Base URL
```
http://localhost:8000/api.php
```

### Authentication
All protected endpoints require Bearer token:
```
Authorization: Bearer {token}
```

### Endpoints

#### 🔓 Public Endpoints

**POST /api.php?action=login**
```json
Request:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "manager",
    "unit_id": null
  }
}
```

#### 🔒 Protected Endpoints

**GET /api.php?action=me**
- Returns current user information

**POST /api.php?action=create_exit_form**
```json
{
  "form_no": "EXIT123",
  "date_shamsi": "1402/08/15",
  "out_type": "تعمیر",
  "driver_name": "علی احمدی",
  "reason": "خرابی موتور",
  "unit_id": 1,
  "items": [
    {
      "description": "موتور برقی",
      "code": "M-001",
      "quantity": 1,
      "unit": "عدد"
    }
  ]
}
```

**POST /api.php?action=create_repair_form**
```json
{
  "form_no": "REPAIR123",
  "date_shamsi": "1402/08/16",
  "description": "تعویض سیم‌پیچ موتور",
  "reference_exit_form_no": "EXIT123",
  "unit_id": 1,
  "items": []
}
```

**POST /api.php?action=create_entry_confirm**
```json
{
  "confirm_no": "ENTRY123",
  "purchase_date_shamsi": "1402/08/20",
  "purchase_center": "کارگاه مرکزی",
  "reference_exit_form_no": "EXIT123",
  "reference_repair_form_no": "REPAIR123",
  "items": [
    {
      "description": "موتور برقی تعمیر شده",
      "code": "M-001",
      "quantity": 1,
      "unit": "عدد"
    }
  ]
}
```

**GET /api.php?action=search_forms&q={query}**
- Search forms by number

**GET /api.php?action=recent_forms&limit={limit}**
- Get recent forms

**GET /api.php?action=all_statuses**
- Get all forms with status

**POST /upload.php**
- Upload files (multipart/form-data)
- Fields: `file`, `entity_type`, `entity_id`

---

## 🛠️ عیب‌یابی / Troubleshooting

### مشکل: دیتابیس ایجاد نشد
**راه‌حل:** مطمئن شوید PHP-SQLite نصب است
```bash
# Linux
sudo apt install php-sqlite3

# Check
php -m | grep sqlite
```

### مشکل: خطای CORS
**راه‌حل:** مطمئن شوید backend روی پورت 8000 و frontend روی 3000 اجرا می‌شود

### مشکل: تاریخ شمسی نمایش داده نمی‌شود
**راه‌حل:** مطمئن شوید `react-multi-date-picker` نصب شده است
```bash
cd frontend
npm install react-multi-date-picker
```

### مشکل: فونت فارسی نمایش داده نمی‌شود
**راه‌حل:** فونت Vazirmatn از CDN بارگذاری می‌شود، اتصال اینترنت را بررسی کنید

---

## 📝 نکات مهم / Important Notes

### فارسی:
- ⚠️ هیچ‌گاه فایل `cmms.db` را به‌طور دستی ویرایش نکنید
- ⚠️ برای محیط production، حتماً رمزهای پیش‌فرض را تغییر دهید
- ⚠️ فایل‌های آپلود شده در پوشه `uploads/` ذخیره می‌شوند
- ⚠️ توکن‌های منقضی شده به‌طور خودکار از دیتابیس پاک نمی‌شوند (نیاز به cron job)

### English:
- ⚠️ Never manually edit the `cmms.db` file
- ⚠️ Change default passwords for production environments
- ⚠️ Uploaded files are stored in `uploads/` directory
- ⚠️ Expired tokens are not automatically cleaned (requires cron job)

---

## 📞 پشتیبانی / Support

برای گزارش مشکلات یا پیشنهادات، لطفاً یک Issue در GitHub ایجاد کنید.

For issues or suggestions, please create a GitHub Issue.

---

## 📄 مجوز / License

این پروژه تحت مجوز MIT منتشر شده است.

This project is licensed under the MIT License.

---

## 🎉 تشکر / Acknowledgments

- React Team برای فریمورک عالی
- TailwindCSS برای استایل‌دهی راحت
- react-multi-date-picker برای تاریخ شمسی
- Vazirmatn Font برای فونت زیبای فارسی

---

**ساخته شده با ❤️ برای مدیریت بهتر تعمیرات معدن**

**Built with ❤️ for better mine maintenance management**
