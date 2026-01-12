
# Neurovia - Intelligent Agricultural Recommendation System

Neurovia is an AI-powered agricultural recommendation system designed to help farmers maximize crop yields and make data-driven farming decisions.

## Features

- 🌾 Crop Recommendation - Based on location, season, soil properties
- 📊 Yield Prediction - Expected yield with confidence scores
- ⚠️ Risk Prediction - Disease risks and preventive measures
- 🧪 Fertilizer Optimization - Optimal recommendations
- 🔐 Secure Authentication - Email and Aadhar verification
- 📱 Multi-Language Support - English and Hindi

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB 7.0+

### Development Setup
```bash
# Install deps
npm install
cd backend && pip install -r requirements.txt

# Configure env
cp .env.example .env  # edit values (Mongo URI, JWT_SECRET_KEY)

# Run backend (terminal 1)
cd backend
python app.py

# Run frontend (terminal 2, project root)
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

### Docker Deployment
```bash
./scripts/start-prod.sh
# or
docker-compose up -d
```

## Documentation

Essential guides (in docs/):
- QUICK_START.md - 5-minute setup
- BACKEND_SETUP.md - Backend & API
- FRONTEND_SETUP.md - Frontend config
- ML_SETUP.md - Model training/testing
- DATABASE_SETUP.md - MongoDB
- DEPLOYMENT_GUIDE.md - Production deploy

## Environment Setup

### Root .env
```
FLASK_ENV=development
MONGODB_URI=mongodb://localhost:27017/neurovia
JWT_SECRET_KEY=your-secret-key
MODEL_DIR=backend/models
VITE_API_URL=http://localhost:5000
```

## Building for Production

```bash
npm run build
docker-compose up -d
```

## Support

- **Issues**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **API**: See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Development**: See docs/ folder

## License

MIT - see LICENSE for details

---

**v1.0.0** | Production Ready 🚀
  