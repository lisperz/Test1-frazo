#!/bin/bash
# Start frontend development server

set -e

echo "🚀 Starting Frontend Development Server..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Set up logging directory
mkdir -p ../logs

# Start the frontend server
echo "⚛️ Starting React development server..."
npm start 2>&1 | tee ../logs/frontend.log