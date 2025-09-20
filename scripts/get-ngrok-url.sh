#!/bin/bash

# Get current ngrok public URL
# Use this to get the URL again if you need to share it

echo "🔍 Getting current ngrok URL..."

if ! pgrep -f ngrok > /dev/null; then
    echo "❌ ngrok is not running"
    echo "💡 Start with: ./scripts/start-ngrok.sh"
    exit 1
fi

# Get the public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok\.io' | head -1)

if [ ! -z "$PUBLIC_URL" ]; then
    echo ""
    echo "📋 Your Video Text Inpainting Service is live at:"
    echo "   $PUBLIC_URL"
    echo ""
    echo "📱 URL copied to clipboard"
    echo "$PUBLIC_URL" | pbcopy 2>/dev/null || true
else
    echo "❌ Could not get ngrok URL. Is ngrok running properly?"
    echo "💡 Try restarting with: ./scripts/start-ngrok.sh"
fi