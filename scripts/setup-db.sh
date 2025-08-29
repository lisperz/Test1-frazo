#!/bin/bash
set -e

echo "🗄️ Setting up Database..."
docker-compose up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

if docker-compose exec -T db pg_isready -U vti_user -d video_text_inpainting; then
    echo "✅ Database is ready!"
else
    echo "❌ Database is not ready."
    exit 1
fi