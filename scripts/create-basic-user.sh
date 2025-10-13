#!/bin/bash

# Create basic user account for testing
# This script creates a free-tier user who can only access Basic Video Editor

cd "$(dirname "$0")/.."

echo "🎯 Creating Basic User Account..."
echo ""

# Activate Python virtual environment if using uv
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run the Python script
python3 scripts/create_basic_user.py

echo ""
echo "✅ Done!"
