#!/bin/bash
# Run backend tests

set -e

echo "🧪 Running Backend Tests..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Source uv environment
export PATH="$HOME/.local/bin:$PATH"

# Activate virtual environment
source .venv/bin/activate

# Run tests
echo "🔬 Running pytest..."
cd backend
python -m pytest -v --tb=short