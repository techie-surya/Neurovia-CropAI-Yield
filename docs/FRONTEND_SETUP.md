# Frontend Setup Guide

## Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

## Installation

### 1. Install Dependencies
```bash
npm install
```

This installs all required packages including:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Shadcn UI components

### 2. Environment Configuration

Create `.env` file in the **project root** folder:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Optional: API timeout (ms)
VITE_API_TIMEOUT=30000
```

**Note:** Environment variables must be prefixed with `VITE_` to be accessible in the frontend.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

Vite provides:
- Hot Module Replacement (HMR) for instant code updates
- Fast development builds
- Type checking with TypeScript

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Project Structure

```
src/
├── App.tsx                      # Main application component
├── main.tsx                     # Entry point
├── index.css                    # Global styles
├── components/
│   ├── Dashboard.tsx            # Main dashboard view
│   ├── YieldPrediction.tsx      # Yield prediction form
│   ├── CropRecommendation.tsx   # Crop suggestion engine
│   ├── RiskPrediction.tsx       # Risk assessment tool
│   ├── FertilizerOptimization.tsx # Nutrient recommendations
│   ├── Weather.tsx              # Weather integration
│   ├── ExplainableAI.tsx        # Model explanation UI
│   ├── AuthModal.tsx            # Login/Register modal
│   ├── ui/                      # Shadcn UI components
│   └── figma/                   # Custom components
├── pages/
│   ├── Home.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
├── context/
│   └── LanguageContext.tsx      # Multi-language support
├── utils/
│   ├── api.ts                   # API communication
│   ├── mockMLModels.ts          # Local ML predictions
│   └── weatherAPI.ts            # Weather data fetching
└── styles/
    └── globals.css              # Global styles
```

## Key Features

### 1. User Authentication
- Email-based registration and login
- JWT token-based authentication
- Password reset functionality

### 2. Crop Recommendation
- AI-powered crop suggestions
- Based on soil characteristics and climate
- Real-time filtering by region

### 3. Yield Prediction
- ML model predictions for crop yield
- Confidence scores
- Historical data comparison

### 4. Risk Assessment
- Multi-factor risk analysis
- Weather-based warnings
- Actionable recommendations
- **Features analyzed:**
  - Rainfall and flood risk
  - Temperature and heat stress
  - Soil drainage and moisture
  - Disease risk factors

### 5. Fertilizer Optimization
- NPK (Nitrogen, Phosphorus, Potassium) calculations
- Soil deficiency analysis
- Cost-effective recommendations

### 6. Weather Integration
- Real-time weather data
- 7-day forecasts
- Historical weather patterns

### 7. Explainable AI
- Feature importance visualization
- Model prediction explanations
- Decision factors breakdown

## Available NPM Scripts

```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Lint TypeScript and JSX files
npm run type-check   # Run TypeScript type checking
```

## API Integration

All API calls are handled through `src/utils/api.ts`:

```typescript
// Example API call
import { predictionAPI } from '@/utils/api';

const result = await predictionAPI.predictCrop({
  nitrogen: 50,
  phosphorus: 40,
  potassium: 30,
  ph: 7.0,
  rainfall: 2000,
  temperature: 25,
  humidity: 60
});
```

## Component Communication

- **Context API** - Language switching via LanguageContext
- **Props** - Direct parent-to-child data flow
- **State Management** - React hooks (useState, useEffect, useCallback)

## Performance Optimization

- Code splitting with React.lazy
- Image optimization with proper formats
- CSS minification in production
- Bundle analysis available via `npm run analyze`

## Troubleshooting

**Port 5173 already in use:**
```bash
# Kill the process
lsof -i :5173
kill -9 <PID>
```

**API connection refused:**
- Verify backend is running on http://localhost:5000
- Check .env file has correct VITE_API_URL
- Check browser console for CORS errors

**HMR not working:**
- Clear browser cache and hard refresh
- Restart dev server: `npm run dev`

## Next Steps

1. Ensure [Backend](BACKEND_SETUP.md) is running
2. Ensure [Database](DATABASE_SETUP.md) is configured
3. Start development: `npm run dev`
4. Open http://localhost:5173 in browser
