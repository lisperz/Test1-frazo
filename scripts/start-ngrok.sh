#!/bin/bash

# Start ngrok tunnel for Video Text Inpainting Service
# This creates a public URL you can share with your boss/client

set -e

echo "🚀 Starting ngrok tunnel for Video Text Inpainting Service..."

# Check if Docker services are running
if ! docker ps | grep -q "vti-frontend\|vti-backend"; then
    echo "⚠️  Starting Docker services first..."
    docker-compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 10
fi

# Health check
echo "🔍 Checking if service is ready..."
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Service is ready on port 80"
else
    echo "❌ Service not responding on port 80. Please check Docker containers:"
    docker ps
    exit 1
fi

# Kill any existing ngrok processes
pkill -f ngrok || true
sleep 2

# Start ngrok tunnel
echo "🌍 Creating public tunnel..."
ngrok http 80 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get URL
echo "⏳ Waiting for ngrok to establish tunnel..."
sleep 5

# Get the public URL
PUBLIC_URL=""
for i in {1..10}; do
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io' | head -1)
        if [ ! -z "$PUBLIC_URL" ]; then
            break
        fi
    fi
    echo "Attempt $i/10 - waiting for ngrok..."
    sleep 2
done

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Failed to get ngrok URL. Check if ngrok is properly configured:"
    echo "Run: ngrok config add-authtoken YOUR_TOKEN"
    echo "Get token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

# Success!
echo ""
echo "🎉 SUCCESS! Your Video Text Inpainting Service is now PUBLIC!"
echo ""
echo "📋 SHARE THIS URL WITH YOUR BOSS/CLIENT:"
echo "   $PUBLIC_URL"
echo ""
echo "📱 Auto-copied to clipboard (if pbcopy available)"
echo "$PUBLIC_URL" | pbcopy 2>/dev/null || true

echo ""
echo "🔧 While ngrok runs, you can:"
echo "   • Modify your code normally"
echo "   • Run: ./scripts/dev-deploy.sh (to update without changing URL)"
echo "   • Run: ./scripts/get-ngrok-url.sh (to get URL again)"
echo "   • Run: ./scripts/stop-ngrok.sh (to stop public access)"
echo ""
echo "⚠️  Keep this terminal open to maintain the public tunnel"
echo "💡 Your service is running at: $PUBLIC_URL"

# Keep ngrok running
wait $NGROK_PID