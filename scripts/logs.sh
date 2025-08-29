#!/bin/bash
# View logs from all services

set -e

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📝 Showing logs for all services..."
    docker-compose logs -f
else
    echo "📝 Showing logs for $SERVICE..."
    docker-compose logs -f "$SERVICE"
fi