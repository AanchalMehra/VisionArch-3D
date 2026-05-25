#!/bin/bash
# VisionArch 3D — Quick Start Script

echo "🏗️  VisionArch 3D"
echo "=================="

# Start backend in background
echo "▶ Starting Flask backend on :5000..."
cd backend && python app.py &
BACKEND_PID=$!

# Give Flask a moment to start
sleep 1

# Start frontend dev server
echo "▶ Starting Vite frontend on :3000..."
cd ../frontend && npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
