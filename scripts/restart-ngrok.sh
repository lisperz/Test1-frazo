#!/bin/bash

# Restart ngrok tunnel (useful when you want a new URL)

echo "🔄 Restarting ngrok tunnel..."

# Stop current tunnel
./scripts/stop-ngrok.sh

echo "⏳ Waiting 3 seconds..."
sleep 3

# Start new tunnel
./scripts/start-ngrok.sh