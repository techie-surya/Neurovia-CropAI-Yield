#!/bin/bash

# Neurovia Development Startup Script
# Starts both frontend and backend services locally

set -e

echo "======================================"
echo "Neurovia Development Environment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
    
    # Try different MongoDB start methods
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo -e "${RED}Could not start MongoDB. Please start it manually.${NC}"
        exit 1
    fi
    
    sleep 2
fi

echo -e "${GREEN}MongoDB is running${NC}"

# Setup backend
echo ""
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}Note: Update backend/.env with your configuration${NC}"
fi

# Start backend in background
echo -e "${GREEN}Starting Flask backend on port 5000...${NC}"
python app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Give backend time to start
sleep 3

# Setup frontend
echo ""
echo -e "${YELLOW}Setting up frontend...${NC}"
cd ../

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.frontend.example .env
    echo -e "${YELLOW}Note: Ensure VITE_API_URL=http://localhost:5000 in .env${NC}"
fi

# Start frontend in background
echo -e "${GREEN}Starting React frontend on port 3000...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Display URLs
echo ""
echo -e "${GREEN}======================================"
echo "Development environment started!"
echo "======================================"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "MongoDB:  ${GREEN}localhost:27017${NC}"
echo ""
echo "View logs:"
echo "  Frontend: tail -f logs/frontend.log"
echo "  Backend:  tail -f logs/backend.log"
echo ""
echo "To stop:"
echo "  Press Ctrl+C to stop services"
echo "======================================"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
}

trap cleanup EXIT

# Keep script running
wait
