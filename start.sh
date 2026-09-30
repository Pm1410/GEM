#!/usr/bin/env bash
# GEM — Government e-Marketplace Bid Verification Platform
# Combined startup script: FastAPI backend + Express/Vite frontend

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     GEM — Bid Verification Platform  (SIH 2026 Prototype)    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Frontend (React/Vite):  http://localhost:3000"
echo "  Backend (FastAPI):       http://localhost:8000"
echo "  API Docs:                http://localhost:8000/docs"
echo ""

# Kill any existing processes on our ports to prevent EADDRINUSE
echo "Cleaning up any existing processes on ports 3000 and 8000..."
pkill -f "uvicorn gem_api" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
sleep 1
echo ""
echo "Starting services..."
echo ""


# Check if Python virtualenv exists
if [ ! -d ".venv" ]; then
  echo "[Setup] Creating Python virtualenv..."
  python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Install Python dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
  echo "[Setup] Installing Python dependencies..."
  pip install -e . -q
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "[Setup] Installing frontend Node.js dependencies..."
  cd frontend && npm install --legacy-peer-deps && cd ..
fi

# Create frontend .env if it doesn't exist
if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
  echo "[Setup] Created frontend/.env from example"
fi

# Start FastAPI in background
echo "[Backend] Starting FastAPI on :8000..."
uvicorn gem_api.main:app --reload --port 8000 --log-level warning &
FASTAPI_PID=$!

# Give FastAPI a moment to start
sleep 2

# Start Express/Vite frontend
echo "[Frontend] Starting Express+Vite on :3000..."
cd frontend
FASTAPI_URL=http://localhost:8000 npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Both services running. Press Ctrl+C to stop."
echo ""

# Trap Ctrl+C to cleanly shut down both
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $FASTAPI_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo "Done."
  exit 0
}

trap cleanup INT TERM

# Wait for both
wait $FASTAPI_PID $FRONTEND_PID
