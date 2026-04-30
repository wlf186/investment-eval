#!/bin/bash

PROJECT_DIR="/home/dev/data/project/gold-crypto-tracker"

echo "Stopping Gold & Crypto Tracker services..."

# Stop backend
if [ -f "$PROJECT_DIR/backend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/backend.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping backend (PID: $PID)..."
        kill $PID
        rm "$PROJECT_DIR/backend.pid"
    else
        echo "Backend not running"
        rm -f "$PROJECT_DIR/backend.pid"
    fi
fi

# Stop frontend
if [ -f "$PROJECT_DIR/frontend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/frontend.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping frontend (PID: $PID)..."
        kill $PID
        rm "$PROJECT_DIR/frontend.pid"
    else
        echo "Frontend not running"
        rm -f "$PROJECT_DIR/frontend.pid"
    fi
fi

echo "✅ All services stopped"
