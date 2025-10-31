# 📥 لینک‌های دانلود / Download Links

## لینک مستقیم محلی / Local Direct Link

بعد از اجرای سرور PHP در پوشه `backend` (با `php -S localhost:8000` یا اسکریپت‌های شروع)، می‌توانید بستهٔ کامل را از اندپوینت زیر دریافت کنید. فایل ZIP هنگام درخواست ساخته می‌شود و هیچ فایل باینری از پیش ذخیره‌شده‌ای در مخزن وجود ندارد.

```
http://localhost:8000/download_zip.php
```

### نمونه دانلود خودکار

```bash
# Linux / macOS
wget http://localhost:8000/download_zip.php -O CMMS-Mine-Maintenance-System.zip

# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/download_zip.php" -OutFile "CMMS-Mine-Maintenance-System.zip"
```

## ساخت ZIP به‌صورت دستی / Manual Packaging

در صورتی که به ZipArchive دسترسی ندارید، می‌توانید در ریشه پروژه خودتان بسته را بسازید:

```bash
zip -r CMMS-Mine-Maintenance-System.zip backend frontend README.md QUICKSTART.md DELIVERY_SUMMARY.md DOWNLOAD_LINKS.md PROJECT_SUMMARY.md VERIFICATION_REPORT.md GITHUB_SETUP.md PUSH_TO_GITHUB.md start-backend.sh start-backend.bat start-frontend.sh start-frontend.bat uploads/.gitkeep .gitignore
```

## گزینه‌های انتشار / Distribution Options

- **GitHub Release:** پس از ساخت بسته (با اندپوینت محلی یا دستور بالا)، فایل ZIP تولید شده را به‌صورت دستی در صفحه Releases آپلود کنید.
- **دانلود Repository:** کاربران همیشه می‌توانند مخزن را به صورت ZIP از GitHub دریافت کنند: `https://github.com/mohammadi939/mine-repair-maintenance-/archive/refs/heads/main.zip`
- **Clone:** `git clone https://github.com/mohammadi939/mine-repair-maintenance-.git`

## یادآوری / Reminder

- فایل‌های باینری (از جمله ZIP‌های خروجی و آیکون‌های PNG) در مخزن نگه‌داری نمی‌شوند تا حجم repository کم و تاریخچه تمیز بماند.
- قبل از انتشار برای کاربران نهایی، حتماً یک بستهٔ جدید بسازید تا مطمئن شوید شامل آخرین تغییرات است.
