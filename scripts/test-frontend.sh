#!/bin/bash
# Run frontend tests

set -e

echo "🧪 Running Frontend Tests..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Navigate to frontend directory
cd frontend

# Run tests
echo "⚛️ Running React tests..."
npm test -- --coverage --watchAll=false