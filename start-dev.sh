#!/bin/bash

# MTF Trading Application - Development Startup Script

echo "🚀 Starting MTF Trading Application Development Environment"
echo "============================================================"

# Check if Python backend is running
if ! curl -s http://localhost:5001/health > /dev/null; then
    echo "📊 Starting Python backend for stock prices..."
    
    # Check if virtual environment exists
    if [ ! -d "backend/venv" ]; then
        echo "📦 Creating Python virtual environment..."
        cd backend
        python -m venv venv
        cd ..
    fi
    
    # Start backend in background
    cd backend
    source venv/bin/activate
    
    # Install dependencies if needed
    pip install -r requirements.txt
    
    echo "🔄 Starting Flask server on port 5001..."
    python app.py &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    sleep 5
else
    echo "✅ Backend already running on port 5001"
fi

# Start React frontend
echo "⚛️  Starting React frontend..."
cd mtf-trading-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your Supabase credentials"
fi

echo "🌐 Starting React development server on port 3000..."
npm start

# Cleanup function
cleanup() {
    echo "🛑 Stopping development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    pkill -f "python app.py" 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5001"
echo "📊 Stock Price API: http://localhost:5001/api/stock-price/RELIANCE"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running
wait