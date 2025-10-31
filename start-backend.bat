@echo off
REM Start Backend Server Script for Windows

echo Starting CMMS Backend Server...
echo.

REM Check if database exists
if not exist "backend\database.sqlite" (
    echo Database not found. Initializing...
    php backend\init_db.php
    echo.
)

REM Start PHP server
echo Starting PHP server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
php -S localhost:8000 -t backend
