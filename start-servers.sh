#!/bin/bash

cd /Users/gabrielgreenstein/blank-wars-clean/

echo "🎮 Starting Blank Wars Local Development Servers..."
echo ""

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3006 | xargs kill -9 2>/dev/null || true
lsof -ti:3007 | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend server
echo "🚀 Starting backend server on port 3006..."
cd backend
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend server
echo "🚀 Starting frontend server on port 3007..."
cd frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 5

echo ""
echo "✅ Servers started!"
echo "📊 Backend: http://localhost:3006 (PID: $BACKEND_PID)"
echo "🎮 Frontend: http://localhost:3007 (PID: $FRONTEND_PID)"
echo ""
echo "📋 To view logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🔥 Testing Real Estate Agent Chat:"
echo "   1. Open http://localhost:3007"
echo "   2. Go to Facilities tab"
echo "   3. Scroll down to 'Real Estate Agent Advisory'"
echo "   4. Try chatting with Vance, Barty, or Celeste!"