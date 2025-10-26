# 🚀 راهنمای سریع / Quick Start Guide

## فارسی

### مرحله ۱: نصب پیش‌نیازها
```bash
# PHP 8+ و Node.js 16+ را نصب کنید
```

### مرحله ۲: راه‌اندازی Backend
```bash
# ترمینال ۱
./start-backend.sh      # Linux/Mac
# یا
start-backend.bat       # Windows
```

### مرحله ۳: راه‌اندازی Frontend
```bash
# ترمینال ۲ (جدید)
./start-frontend.sh     # Linux/Mac
# یا
start-frontend.bat      # Windows
```

### مرحله ۴: مرورگر خود را باز کنید
```
http://localhost:3000
```

### ورود به سیستم
```
نام کاربری: admin
رمز عبور: admin123
```

---

## English

### Step 1: Install Prerequisites
```bash
# Install PHP 8+ and Node.js 16+
```

### Step 2: Start Backend
```bash
# Terminal 1
./start-backend.sh      # Linux/Mac
# or
start-backend.bat       # Windows
```

### Step 3: Start Frontend
```bash
# Terminal 2 (new terminal)
./start-frontend.sh     # Linux/Mac
# or
start-frontend.bat      # Windows
```

### Step 4: Open Your Browser
```
http://localhost:3000
```

### Login
```
Username: admin
Password: admin123
```

---

## 📝 دستورات دستی / Manual Commands

### Backend (Terminal 1)
```bash
cd backend
php init_db.php        # Initialize database (first time only)
php -S localhost:8000  # Start server
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install           # Install dependencies (first time only)
npm start            # Start development server
```

---

## ✅ بررسی موفقیت‌آمیز بودن / Verify Success

اگر همه چیز درست کار کند، باید:
- Backend در `http://localhost:8000` فعال باشد
- Frontend در `http://localhost:3000` باز شود
- صفحه ورود را ببینید

If everything works:
- Backend running at `http://localhost:8000`
- Frontend opens at `http://localhost:3000`
- You see the login page

---

## 🆘 مشکل دارید؟ / Having Issues?

مستندات کامل را ببینید: `README.md`

See full documentation: `README.md`
