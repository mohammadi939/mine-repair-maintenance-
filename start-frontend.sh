#!/bin/bash
# Start Frontend Development Server Script

echo "🚀 Starting CMMS Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting React development server on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""
npm start
