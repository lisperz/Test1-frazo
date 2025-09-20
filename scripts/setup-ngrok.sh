#!/bin/bash

# Ngrok Setup Script for Video Text Inpainting Service
# Run this once to install and configure ngrok

set -e

echo "🚀 Setting up ngrok for Video Text Inpainting Service..."

# Check if ngrok is already installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is already installed"
else
    echo "📦 Installing ngrok..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "Please install Homebrew first or download ngrok from https://ngrok.com/download"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "Please download ngrok from https://ngrok.com/download for your OS"
        exit 1
    fi
fi

# Create ngrok config directory if it doesn't exist
mkdir -p ~/.config/ngrok

# Check if auth token is configured
if ! ngrok config check &> /dev/null; then
    echo ""
    echo "⚠️  IMPORTANT: You need to configure ngrok with your auth token"
    echo "1. Sign up at https://ngrok.com/"
    echo "2. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "After that, run './scripts/start-ngrok.sh' to get your public URL"
else
    echo "✅ ngrok is configured and ready"
    echo ""
    echo "🎯 Next step: Run './scripts/start-ngrok.sh' to get your public URL"
fi

echo "✅ Setup complete!"