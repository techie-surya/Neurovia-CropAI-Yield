# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file in root folder:
```
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Server
```bash
npm run dev
```

App runs at: http://localhost:5173

### 4. Build for Production
```bash
npm run build
```

## Project Structure
```
src/
├── App.tsx             # Main application
├── main.tsx           # Entry point
├── components/        # React components
│   ├── Dashboard.tsx
│   ├── YieldPrediction.tsx
│   ├── CropRecommendation.tsx
│   ├── RiskPrediction.tsx
│   └── Weather.tsx
└── utils/             # Utility functions
```

## Available Features

- User Authentication
- Yield Prediction
- Crop Recommendation
- Risk Assessment
- Weather Integration
- Explainable AI
