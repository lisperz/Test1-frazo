#!/bin/bash

# Development Deployment Script
# Updates your code while keeping the same ngrok URL

set -e

echo "🔄 Updating Video Text Inpainting Service (keeping same public URL)..."

# Check if ngrok is running
if ! pgrep -f ngrok > /dev/null; then
    echo "❌ ngrok is not running. Start with: ./scripts/start-ngrok.sh"
    exit 1
fi

# Get current public URL before updating
CURRENT_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
if [ ! -z "$CURRENT_URL" ]; then
    echo "🌍 Public URL: $CURRENT_URL (stays the same)"
fi

# Rebuild and restart services
echo "🔧 Rebuilding services with latest code..."
docker-compose build

echo "🔄 Restarting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to restart..."
sleep 10

# Health check
echo "🔍 Verifying service is ready..."
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Service updated successfully!"
    if [ ! -z "$CURRENT_URL" ]; then
        echo "🎉 Your updated service is live at: $CURRENT_URL"
        echo "📱 URL copied to clipboard"
        echo "$CURRENT_URL" | pbcopy 2>/dev/null || true
    fi
else
    echo "❌ Service not responding. Check logs:"
    docker-compose logs --tail=20
    exit 1
fi

echo ""
echo "💡 Your code changes are now live at the same public URL!"
echo "🔧 Continue coding and run this script again to deploy updates"