#!/bin/bash
# Start Backend Server Script

echo "🚀 Starting CMMS Backend Server..."
echo ""

# Check if database exists
if [ ! -f "backend/cmms.db" ]; then
    echo "⚠️  Database not found. Initializing..."
    cd backend
    php init_db.php
    cd ..
    echo ""
fi

# Start PHP server
echo "Starting PHP server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""
cd backend
php -S localhost:8000
