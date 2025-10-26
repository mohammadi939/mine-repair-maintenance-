@echo off
REM Start Frontend Development Server Script for Windows

echo Starting CMMS Frontend...
echo.

cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting React development server on http://localhost:3000
echo Press Ctrl+C to stop
echo.
npm start
