@echo off
REM Start Backend Server Script for Windows

echo Starting CMMS Backend Server...
echo.

REM Check if database exists
if not exist "backend\cmms.db" (
    echo Database not found. Initializing...
    cd backend
    php init_db.php
    cd ..
    echo.
)

REM Start PHP server
echo Starting PHP server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
cd backend
php -S localhost:8000
