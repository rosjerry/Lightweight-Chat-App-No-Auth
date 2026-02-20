#!/bin/bash

echo "Starting Lightweight Chat App Development Environment..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting Flask backend server..."
cd server
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "Starting React frontend..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
