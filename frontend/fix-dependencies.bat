@echo off
REM اسکریپت رفع مشکل TailwindCSS و وابستگی‌ها (Windows)

echo Starting TailwindCSS fix...
echo.

REM حذف node_modules و فایل‌های قفل
echo Step 1: Cleaning up old files...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json
if exist .cache rmdir /s /q .cache
echo Done!
echo.

REM نصب وابستگی‌ها با نسخه‌های خاص
echo Step 2: Installing dependencies with correct versions...
call npm install --save tailwindcss@3.3.5 postcss@8.4.31 autoprefixer@10.4.16 react@18.2.0 react-dom@18.2.0 react-router-dom@6.20.0

echo.
echo Step 3: Installing remaining dependencies...
call npm install

echo.
echo All done!
echo.
echo To start the app, run:
echo    npm start
echo.
pause
