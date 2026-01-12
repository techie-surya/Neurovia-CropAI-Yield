#!/bin/bash

# Neurovia Docker Production Startup Script
# Starts all services with Docker Compose

set -e

echo "======================================"
echo "Neurovia Production Environment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    exit 1
fi

# Check if required environment variables are set
echo "Checking environment variables..."
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo "Create backend/.env from backend/.env.example"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Using defaults...${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers (if any)...${NC}"
docker-compose down --remove-orphans || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

# Create logs directory
mkdir -p logs

# Start services
echo -e "${GREEN}Starting services with Docker Compose...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo ""
echo -e "${YELLOW}Checking service health...${NC}"

# Check MongoDB
if docker exec neurovia-mongo mongosh -u admin -p password123 -c "db.adminCommand('ping')" &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is healthy${NC}"
else
    echo -e "${RED}✗ MongoDB failed to start${NC}"
fi

# Check Backend
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
fi

# Display service information
echo ""
echo -e "${GREEN}======================================"
echo "Production environment started!"
echo "======================================"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "MongoDB:  ${GREEN}localhost:27017${NC}"
echo ""
echo "Service logs:"
echo "  All:      docker-compose logs -f"
echo "  Backend:  docker-compose logs -f backend"
echo "  Frontend: docker-compose logs -f frontend"
echo "  MongoDB:  docker-compose logs -f mongodb"
echo ""
echo "Useful commands:"
echo "  Status:   docker-compose ps"
echo "  Restart:  docker-compose restart"
echo "  Stop:     docker-compose down"
echo "  Rebuild:  docker-compose up -d --build"
echo "======================================"
echo ""

# Optional: Tail logs
if [ "$1" = "-logs" ]; then
    docker-compose logs -f
fi
