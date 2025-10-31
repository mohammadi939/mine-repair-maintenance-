# سامانه مدیریت تعمیرات معدن (CMMS)

یک پروژه‌ی کامل Backend + Frontend برای مدیریت تعمیرات تجهیزات معدن با رابط کاربری فارسی، راست‌به‌چپ و پشتیبانی کامل از تاریخ جلالی.

## ✨ امکانات کلیدی
- احراز هویت مبتنی بر توکن (Bearer) با انقضای ۲۴ ساعته و مدیریت نقش‌های `admin`، `user`، `viewer`.
- مدیریت کاربران (CRUD) ویژه مدیر سیستم.
- فرم‌های «درخواست خروج»، «تعمیر بیرونی» و «تأیید ورود» با محدودیت ۱ تا ۵ قلم در هر درخواست و ثبت فایل‌های قبل/بعد.
- ثبت تاریخچه‌ی تغییر وضعیت هر قلم در جدول جداگانه به‌همراه زمان ISO و شمسی.
- تایم‌لاین گرافیکی با انیمیشن (Framer Motion) و نمایش آخرین رخدادها (Newest First).
- انتخابگر تاریخ شمسی (`react-datepicker2` + `moment-jalaali`) با اعداد فارسی.
- آپلود چندگانه‌ی تصاویر/اسناد برای هر قلم از طریق API اختصاصی.
- داشبورد واکنش‌گرا با رنگ‌های صنعتی (تیره + طلایی) و پشتیبانی از حالت روشن/تاریک.
- جستجو و افزودن سریع واحدها، کارگاه‌ها و تجهیزات (Inventory) در لحظه.
- گزارش‌گیری با فیلتر بازه زمانی و نمودار Chart.js از تعداد درخواست‌ها بر اساس وضعیت.
- خروجی PDF برای هر درخواست همراه با QR Code.
- API پشتیبان‌گیری/بازیابی از فایل `database.sqlite` ویژه مدیر.
- تولید QR برای هر درخواست و نمایش در جزئیات و فایل PDF.
- اسکریپت تست سریع `backend/test_smoke.php` جهت اطمینان از آماده بودن احراز هویت و سرویس‌ها.
- پوشه‌ی `backend/uploads` برای نگه‌داری فایل‌های بارگذاری شده.

## 📁 ساختار پروژه
```
.
├── backend/
│   ├── api/
│   │   ├── auth.php
│   │   ├── users.php
│   │   ├── units.php
│   │   ├── workshops.php
│   │   ├── inventory.php
│   │   ├── requests.php
│   │   ├── history.php
│   │   ├── upload.php
│   │   └── backup.php
│   ├── db.php
│   ├── init_db.php
│   ├── test_smoke.php
│   ├── uploads/
│   │   └── .gitkeep
│   └── database.sqlite (ایجاد پس از اجرای init)
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── hooks/useApi.js
│       └── components/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── ShamsiDatePicker.jsx
│           ├── TimelineModal.jsx
│           ├── QRView.jsx
│           ├── Reports.jsx
│           ├── BackupPanel.jsx
│           └── Toast.jsx
├── start-backend.sh / .bat
├── start-frontend.sh / .bat
└── mine-repair-project.zip (پس از ساخت دستی)
```

## 🔐 اطلاعات ورود پیش‌فرض
| نقش | نام کاربری | رمز عبور |
| --- | --- | --- |
| مدیر (`admin`) | `admin` | `admin123` |

> **حتماً پس از اولین ورود رمز عبور را تغییر دهید.**

## 🧰 پیش‌نیازها
- **PHP 8.0+** با افزونه‌ی `pdo_sqlite`
- **SQLite3**
- **Node.js 16+** و `npm`

### نصب پیش‌نیازها (Linux مثال Ubuntu/Debian)
```bash
sudo apt update
sudo apt install php php-sqlite3 php-mbstring unzip
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### نصب پیش‌نیازها (Windows)
1. نصب XAMPP یا PHP مستقل (نسخه 8 به بالا).
2. فعال بودن افزونه‌ی `php_sqlite3` در php.ini.
3. نصب Node.js (https://nodejs.org).

## 🚀 راه‌اندازی سریع
### 1) راه‌اندازی Backend
#### Linux / macOS
```bash
./start-backend.sh
```
#### Windows
```bat
start-backend.bat
```
این اسکریپت در صورت عدم وجود `database.sqlite` آن را می‌سازد و سپس سرور PHP را روی `http://localhost:8000` اجرا می‌کند.

### 2) راه‌اندازی Frontend
#### Linux / macOS
```bash
./start-frontend.sh
```
#### Windows
```bat
start-frontend.bat
```
اولین اجرا، وابستگی‌ها را نصب کرده و سپس React Dev Server را روی `http://localhost:3000` اجرا می‌کند.

## 📡 نقاط پایانی (Backend)
| Endpoint | Method | توضیح |
| --- | --- | --- |
| `/backend/api/auth.php` | POST | ورود و دریافت توکن |
| `/backend/api/auth.php` | GET | دریافت اطلاعات کاربر جاری |
| `/backend/api/auth.php` | DELETE | خروج و حذف توکن |
| `/backend/api/users.php` | GET/POST/PUT/DELETE | مدیریت کاربران (مدیر) |
| `/backend/api/units.php` | GET/POST | مدیریت واحدها |
| `/backend/api/workshops.php` | GET/POST | مدیریت کارگاه‌ها |
| `/backend/api/inventory.php` | GET/POST | مدیریت تجهیزات |
| `/backend/api/requests.php` | GET/POST/PUT | ثبت و به‌روزرسانی درخواست‌ها |
| `/backend/api/history.php` | GET | تاریخچه‌ی یک درخواست یا قلم |
| `/backend/api/upload.php` | POST | بارگذاری فایل برای اقلام |
| `/backend/api/backup.php` | GET/POST | دانلود یا بازیابی پایگاه‌داده (مدیر) |

## 🧪 نمونه دستورات cURL
> پیش‌فرض: سرور backend روی `http://localhost:8000` اجرا شده است.

### دریافت توکن
```bash
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  http://localhost:8000/backend/api/auth.php | jq -r '.token')
```

### ایجاد واحد و کارگاه جدید
```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"واحد حفاری"}' \
  http://localhost:8000/backend/api/units.php

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"کارگاه مرکزی"}' \
  http://localhost:8000/backend/api/workshops.php
```

### ثبت درخواست خروج با بارگذاری تصویر
```bash
REQUEST_PAYLOAD='{
  "type":"exit",
  "request_number":"EX-1001",
  "requester_unit_id":1,
  "workshop_id":1,
  "date_shamsi":"1402/12/20",
  "description":"نیاز به تعمیر فوری",
  "items":[{
    "name":"پمپ هیدرولیک",
    "serial":"P-7788",
    "status":"ارسال به تعمیرگاه",
    "quantity":1,
    "unit":"عدد",
    "note":"نشت روغن" 
  }]
}'

REQUEST_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD" \
  http://localhost:8000/backend/api/requests.php | jq -r '.request_id')

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "request_id=$REQUEST_ID" \
  -F "item_index=0" \
  -F "type=before" \
  -F "file=@sample-before.jpg" \
  http://localhost:8000/backend/api/upload.php
```

### به‌روزرسانی وضعیت قلم و بررسی تاریخچه
```bash
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":'$REQUEST_ID',"items":[{"name":"پمپ هیدرولیک","serial":"P-7788","status":"در حال تعمیر","quantity":1,"unit":"عدد"}],"note":"قطعه به کارگاه مرکزی رسید"}' \
  http://localhost:8000/backend/api/requests.php

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/backend/api/history.php?request_id=$REQUEST_ID"
```

### دانلود نسخه پشتیبان دیتابیس
```bash
curl -H "Authorization: Bearer $TOKEN" -o database-backup.sqlite http://localhost:8000/backend/api/backup.php
```

## 🧪 تست خودکار
```bash
php backend/test_smoke.php http://localhost:8000/backend/api
```
این اسکریپت ورود مدیر و دریافت فهرست واحدها را بررسی می‌کند.

## 🗂 ساخت بسته‌ی ZIP تحویل
برای تولید فایل `mine-repair-project.zip` که شامل کل پروژه باشد، در ریشه‌ی مخزن اجرا کنید:
```bash
zip -r mine-repair-project.zip backend frontend README.md start-backend.* start-frontend.*
```
(برای Windows می‌توانید از ابزار فشرده‌سازی گرافیکی استفاده کنید.)

## ✅ چک‌لیست تحویل
- [x] احراز هویت و نقش‌ها
- [x] ثبت و تاریخچه‌ی اقلام (History Timeline)
- [x] تایم‌لاین با انیمیشن
- [x] انتخابگر تاریخ شمسی
- [x] آپلود فایل‌ها
- [x] پشتیبان‌گیری و بازیابی دیتابیس
- [x] QR Code در جزئیات و PDF
- [x] گزارش‌ها (نمودار + خروجی PDF)
- [x] README کامل با دستورالعمل اجرا
