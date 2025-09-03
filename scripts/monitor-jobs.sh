#!/bin/bash

# Real-time job status monitor
# Runs every 30 seconds to check and update job statuses

echo "Starting real-time job status monitor..."
echo "Press Ctrl+C to stop"

while true; do
    echo "[$(date)] Checking job statuses..."
    python3 /Users/zhuchen/Downloads/Test1-frazo/check_jobs.py
    echo "[$(date)] Waiting 30 seconds..."
    sleep 30
done