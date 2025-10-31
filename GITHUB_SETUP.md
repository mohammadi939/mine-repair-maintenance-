# 🚀 راهنمای انتشار در GitHub / GitHub Publishing Guide

## وضعیت فعلی / Current Status

این پروژه در حال حاضر فقط به‌صورت محلی موجود است و به GitHub منتشر نشده است.

This project is currently only available locally and has not been published to GitHub.

---

## 📝 مراحل انتشار در GitHub / Steps to Publish on GitHub

### مرحله 1: ایجاد Repository در GitHub

1. به [GitHub.com](https://github.com) بروید و وارد حساب خود شوید
2. روی دکمه **New Repository** کلیک کنید
3. اطلاعات زیر را وارد کنید:
   - **Repository name**: `cmms-mine-maintenance`
   - **Description**: `سامانه مدیریت تعمیرات معدن - Mine Maintenance Management System (CMMS)`
   - **Visibility**: Public یا Private (به انتخاب شما)
   - **Initialize**: هیچ‌کدام از گزینه‌ها را انتخاب نکنید (README, .gitignore, license)

### مرحله 2: آماده‌سازی پروژه

```bash
cd /workspace

# اگر git init نشده، اجرا کنید (احتمالاً قبلاً init شده)
# git init

# افزودن تمام فایل‌ها
git add .

# Commit اولیه
git commit -m "Initial commit: Complete CMMS Mine Maintenance System

- Backend: PHP 8 + SQLite with 12 API endpoints
- Frontend: React + TailwindCSS with RTL/Persian support
- Features: Exit/Repair/Entry forms with Jalali date picker
- Documentation: Complete bilingual docs (Persian/English)
- Ready to use with default admin account
"
```

### مرحله 3: اتصال به GitHub

```bash
# جایگزین کنید با URL مخزن خودتان
git remote add origin https://github.com/YOUR_USERNAME/cmms-mine-maintenance.git

# بررسی remote
git remote -v

# ایجاد و انتقال به branch اصلی
git branch -M main

# Push به GitHub
git push -u origin main
```

### مرحله 4: تنظیمات مخزن

پس از push، در GitHub:

1. **About**: توضیحات پروژه را اضافه کنید
2. **Topics**: تگ‌های مناسب اضافه کنید:
   - `maintenance-management`
   - `cmms`
   - `persian`
   - `jalali-calendar`
   - `react`
   - `php`
   - `sqlite`
   - `rtl`
   - `mining`

3. **README**: به‌طور خودکار از README.md نمایش داده می‌شود

---

## 🌐 لینک پیشنهادی مخزن / Suggested Repository URL

بعد از انتشار، لینک مخزن به شکل زیر خواهد بود:

```
https://github.com/YOUR_USERNAME/cmms-mine-maintenance
```

---

## 📋 فایل‌هایی که commit می‌شوند / Files to be Committed

### Backend
- `backend/init_db.php`
- `backend/api.php`
- `backend/upload.php`

### Frontend
- تمام فایل‌های `frontend/src/`
- `frontend/public/`
- `frontend/package.json`
- فایل‌های تنظیمات (tailwind, postcss)

### Documentation
- `README.md`
- `QUICKSTART.md`
- `PROJECT_SUMMARY.md`
- `VERIFICATION_REPORT.md`
- `DELIVERY_SUMMARY.md`

### Scripts
- `start-backend.sh`
- `start-backend.bat`
- `start-frontend.sh`
- `start-frontend.bat`

### Configuration
- `.gitignore` (فایل‌های غیرضروری را ignore می‌کند)

---

## ⚠️ توجه / Note

فایل‌های زیر commit **نمی‌شوند** (در .gitignore هستند):

- `node_modules/` - باید با `npm install` نصب شوند
- `backend/cmms.db` - باید با `php init_db.php` ساخته شود
- `uploads/*` - فایل‌های آپلود شده
- فایل‌های build

---

## 🎯 نمونه README.md Badge‌ها

پس از انتشار، می‌توانید این badge‌ها را به README اضافه کنید:

```markdown
![PHP Version](https://img.shields.io/badge/PHP-8.0%2B-blue)
![React Version](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![RTL](https://img.shields.io/badge/RTL-Persian-success)
```

---

## 📦 انتشار Release

پس از push موفقیت‌آمیز:

1. به **Releases** بروید
2. **Create a new release** را کلیک کنید
3. تگ `v1.0.0` بسازید
4. عنوان: `نسخه 1.0.0 - راه‌اندازی اولیه`
5. توضیحات را از `DELIVERY_SUMMARY.md` کپی کنید
6. با اجرای اندپوینت `download_zip.php` یک فایل `CMMS-Mine-Maintenance-System.zip` تازه بسازید و همان را attach کنید
7. **Publish release** را کلیک کنید

---

## 🔗 لینک‌های مفید / Useful Links

پس از انتشار:

- **Repository**: `https://github.com/YOUR_USERNAME/cmms-mine-maintenance`
- **Issues**: `https://github.com/YOUR_USERNAME/cmms-mine-maintenance/issues`
- **Releases**: `https://github.com/YOUR_USERNAME/cmms-mine-maintenance/releases`
- **Clone URL**: `git clone https://github.com/YOUR_USERNAME/cmms-mine-maintenance.git`

---

## 🤝 مشارکت / Contributing

اگر می‌خواهید دیگران به پروژه مشارکت کنند:

1. فایل `CONTRIBUTING.md` بسازید
2. Guidelines مشارکت را مشخص کنید
3. Code of Conduct اضافه کنید
4. Issue templates بسازید

---

## 📄 License

این پروژه تحت مجوز MIT منتشر شده است. فایل LICENSE موجود است.

---

## ❓ سوالات متداول / FAQ

### چرا node_modules در git نیست؟
چون حجم زیادی دارد و با `npm install` قابل بازسازی است.

### چرا فایل .db در git نیست؟
چون باید با `php init_db.php` ساخته شود تا داده‌های پیش‌فرض درست ایجاد شوند.

### می‌توانم ZIP را در git بگذارم؟
بله، اما معمولاً بهتر است ZIP را فقط در Releases منتشر کنید.

---

**اگر نیاز به کمک برای انتشار دارید، با من در ارتباط باشید!**

**If you need help publishing, feel free to reach out!**
