#!/bin/bash
set -e

echo "🛑 Stopping Video Text Inpainting Service..."
docker-compose down
echo "✅ All services stopped successfully!"