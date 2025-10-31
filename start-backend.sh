#!/bin/bash
# Start Backend Server Script

echo "🚀 Starting CMMS Backend Server..."
echo ""

# Check if database exists
if [ ! -f "backend/database.sqlite" ]; then
    echo "⚠️  Database not found. Initializing..."
    php backend/init_db.php
    echo ""
fi

# Start PHP server
echo "Starting PHP server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""
php -S localhost:8000 -t backend
