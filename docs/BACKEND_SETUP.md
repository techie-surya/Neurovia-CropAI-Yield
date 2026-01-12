# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure MongoDB
```bash
# Start MongoDB service
net start MongoDB
```

### 3. Environment Setup
Create `.env` file in backend folder:
```
MONGODB_URI=mongodb://localhost:27017/neurovia
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### 4. Start Backend Server
```bash
python app.py
```

Server runs at: http://localhost:5000

## API Endpoints

- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/predict/yield` - Yield prediction
- POST `/api/predict/crop` - Crop recommendation
- POST `/api/predict/risk` - Risk prediction

## Project Structure
```
backend/
├── app.py              # Main Flask application
├── train_models.py     # Model training script
├── test_models.py      # Model testing script
├── data_pipeline.py    # Data processing pipeline
├── models/             # Trained ML models
├── data/               # Datasets
└── logs/               # Application logs
```
