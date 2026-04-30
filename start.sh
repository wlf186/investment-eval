#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
# 默认端口，实际部署时可按需修改
BACKEND_PORT=30306
FRONTEND_PORT=30305

echo "=========================================="
echo "Gold & Crypto Tracker - Starting services"
echo "=========================================="

# Check if backend port is in use
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "⚠️  Backend port $BACKEND_PORT is already in use. Stopping existing process..."
    kill $(lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 1
fi

# Check if frontend port is in use
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t > /dev/null 2>&1; then
    echo "⚠️  Frontend port $FRONTEND_PORT is already in use. Stopping existing process..."
    kill $(lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 1
fi

# Start backend (internal port 30306)
echo "🚀 Starting backend on port $BACKEND_PORT..."
cd "$PROJECT_DIR"
source .venv/bin/activate
nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend failed to start. Check backend.log"
    exit 1
fi

# Start frontend (public port 30305, proxies /api to backend)
echo "🚀 Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_DIR/frontend"
source ~/.nvm/nvm.sh && nvm use 24
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend failed to start. Check frontend.log"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ All services started successfully!"
echo "=========================================="
echo "Application:  http://localhost:$FRONTEND_PORT"
echo "API Proxy:    http://localhost:$FRONTEND_PORT/api/* -> backend:$BACKEND_PORT"
echo "Health Check: http://localhost:$FRONTEND_PORT/health"
echo ""
echo "Logs:"
echo "  Backend:  $PROJECT_DIR/backend.log"
echo "  Frontend: $PROJECT_DIR/frontend/frontend.log"
echo ""
echo "To stop: ./stop.sh"
echo "=========================================="
