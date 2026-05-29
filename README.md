# Neurovia - Intelligent Agricultural Recommendation System

**A Hackathon Project** 🚀
Farmers today faced poor crop yield prediction due to lack of rael time insight. The problem is 30% of crop failed due to poor planning. Farmers donot know:
1. which crop is suitable for their soil.
2. how much yiels to expect.
3. what risks they faced

AgroAI is based on AI-powered agricultural recommendation system designed to help farmers maximize the crop yields and make data-driven farming decisions. Built with modern web technologies and machine learning, this platform provides comprehensive decision support for sustainable agriculture.
This platform also helps in predicting historical agricultural data, weather patterns and soil health metrics. The system should provide actionable recommodation for farmers to optimize irrigation,fertilization, and pest control, tailored to specific crops and regional conditions.

## 🌟 Key Features

- **🌾 Crop Recommendation** - AI-powered suggestions based on soil, climate, other factors and location data
- **📊 Yield Prediction** - ML models predicting expected yields with confidence scores
- **⚠️ Risk Assessment** - Early warning system for weather risks, disease, and drought
- **🧪 Fertilizer Optimization** - Nutrient recommendations based on soil analysis
- **🔐 Secure Authentication** - Email-based user accounts with secure password storage
- **🌐 Responsive UI** - Modern React interface optimized for desktop and mobile
- dashboard:<img width="1203" height="651" alt="DASHBOARD IMAGE" src="https://github.com/user-attachments/assets/8745c5e0-7e36-4ede-aa49-3ceac619b63d" />


## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn UI
- Axios for API communication

**Backend:**
- Python Flask (REST API)
- MongoDB (NoSQL database)
- scikit-learn (ML models)
- JWT authentication

**ML & Data:**
- Scikit-learn for predictions
- Pandas for data processing
- Numpy for calculations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MongoDB 7.0+ (local or cloud)

### Development Setup

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd Neurovia
npm install
cd backend && pip install -r requirements.txt

# 2. Configure environment
# Create .env in root folder
FLASK_ENV=development
MONGODB_URI=mongodb://localhost:27017/neurovia
JWT_SECRET_KEY=your-secret-key-here
VITE_API_URL=http://localhost:5000

# 3. Start services
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📚 Documentation

Setup guides in `docs/` folder:
- [FRONTEND_SETUP.md](docs/FRONTEND_SETUP.md) - React configuration and component guide
- [BACKEND_SETUP.md](docs/BACKEND_SETUP.md) - Flask API endpoints and server setup
- [DATABASE_SETUP.md](docs/DATABASE_SETUP.md) - MongoDB configuration and schemas

## 📁 Project Structure

```
Neurovia/
├── src/                          # Frontend (React)
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Page components
│   ├── utils/                   # Helper functions & API calls
│   └── App.tsx                  # Main app component
├── backend/                     # Backend (Python/Flask)
│   ├── app.py                   # Main Flask application
│   ├── train_models.py          # ML model training
│   ├── data_pipeline.py         # Data processing
│   ├── models/                  # Trained ML models
│   └── data/                    # Datasets (raw/processed)
├── docs/                        # Documentation
│   ├── FRONTEND_SETUP.md
│   ├── BACKEND_SETUP.md
│   └── DATABASE_SETUP.md
└── docker-compose.yml           # Docker deployment config
```

## 🔐 Environment Variables

Create `.env` file in project root:

```bash
# Flask
FLASK_ENV=development
FLASK_DEBUG=true

# Database
MONGODB_URI=mongodb://localhost:27017/neurovia

# Authentication
JWT_SECRET_KEY=your-secure-random-key-here

# Frontend
VITE_API_URL=http://localhost:5000
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d

# Services will run on:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

## 🧪 Testing

```bash
# Run ML model tests
cd backend
python test_models.py

# Train models on new data
python train_models.py
```

## 🎯 Core Capabilities

### Crop Recommendation
Analyzes soil pH, NPK levels, rainfall, temperature, and humidity to recommend suitable crops.

### Yield Prediction
Predicts expected crop yield based on historical data and current conditions with confidence intervals.

### Risk Assessment
Monitors weather patterns, soil conditions, and crop health to predict risks:
- **Flood Risk** - Based on rainfall and soil drainage
- **Drought Risk** - Based on water availability and temperature
- **Heat Stress** - Based on temperature extremes

### Fertilizer Optimization
Calculates optimal NPK (Nitrogen, Phosphorus, Potassium) ratios based on soil deficiencies and crop requirements.

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Report bugs and issues
- Suggest improvements
- Submit pull requests
- Improve documentation
