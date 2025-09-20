#!/bin/bash

# Stop ngrok tunnel and remove public access

echo "🛑 Stopping ngrok tunnel..."

# Kill ngrok processes
if pgrep -f ngrok > /dev/null; then
    pkill -f ngrok
    echo "✅ ngrok tunnel stopped"
    echo "🔒 Public access removed"
else
    echo "ℹ️  ngrok was not running"
fi

# Clean up
rm -f /tmp/ngrok.log

echo "💡 Your service is still running locally at http://localhost:80"
echo "🚀 To make it public again, run: ./scripts/start-ngrok.sh"