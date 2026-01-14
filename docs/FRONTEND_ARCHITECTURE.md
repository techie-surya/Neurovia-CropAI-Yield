# Frontend Architecture Documentation

**Neurovia CropAI Yield Prediction Platform**  
*Complete Frontend Documentation*

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Entry Points & Bootstrap](#entry-points--bootstrap)
5. [Routing & Navigation](#routing--navigation)
6. [Context & State Management](#context--state-management)
7. [Core Components](#core-components)
8. [Utility Modules](#utility-modules)
9. [UI Component Library](#ui-component-library)
10. [Data Flow](#data-flow)
11. [Authentication](#authentication)
12. [Internationalization (i18n)](#internationalization-i18n)
13. [Development & Build](#development--build)

---

## 🌟 Overview

The frontend is a **React + TypeScript** single-page application (SPA) built with **Vite** as the build tool. It provides an AI-powered agricultural intelligence platform for farmers, agronomists, and policymakers to:

- Predict crop yields based on field conditions
- Get crop recommendations for specific soil/climate
- Assess cultivation risks
- Optimize fertilizer and water usage
- Simulate "what-if" scenarios
- Understand AI decision-making with explainability features
- Monitor real-time weather conditions

The app is bilingual (English/Hindi), responsive, and features rich data visualizations with Recharts.

---

## 🛠 Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite 5.x (with SWC plugin) |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS 3.x |
| **Charts** | Recharts 2.x |
| **UI Components** | Custom library (Radix UI primitives + shadcn patterns) |
| **HTTP Client** | Native Fetch API |
| **State Management** | React Context API (LanguageContext) |
| **Icons/Emojis** | Unicode emojis (no icon library) |
| **Date/Time** | Native JavaScript Date API |

---

## 📁 Project Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Root component with routing
├── index.css                   # Global CSS entry (Tailwind directives)
├── components/                 # Feature components
│   ├── Dashboard.tsx           # Main dashboard view
│   ├── YieldPrediction.tsx     # Yield prediction form
│   ├── CropRecommendation.tsx  # Crop suggestion engine
│   ├── FertilizerOptimization.tsx  # Resource optimization
│   ├── RiskPrediction.tsx      # Risk assessment
│   ├── WhatIfSimulator.tsx     # Scenario simulator
│   ├── ExplainableAI.tsx       # Feature importance viewer
│   ├── Weather.tsx             # Weather page
│   ├── WeatherWidget.tsx       # Reusable weather card
│   ├── AuthModal.tsx           # Authentication modal
│   ├── ui/                     # Generic UI components (45+ files)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── chart.tsx
│   │   └── ... (40+ more)
│   └── figma/
│       └── ImageWithFallback.tsx
├── pages/                      # Page-level components
│   ├── Home.tsx                # Landing page
│   ├── LoginPage.tsx           # Login form page
│   ├── RegisterPage.tsx        # Registration page
│   ├── ForgotPasswordPage.tsx  # Password recovery
│   └── ResetPasswordPage.tsx   # Password reset
├── context/
│   └── LanguageContext.tsx     # i18n context provider
├── utils/
│   ├── api.ts                  # Backend API client
│   ├── weatherAPI.ts           # OpenWeatherMap integration
│   └── mockMLModels.ts         # Mock ML predictions
├── styles/
│   └── globals.css             # Additional global styles
└── guidelines/                 # Internal docs (not compiled)
    └── Guidelines.md
```

---

## 🚀 Entry Points & Bootstrap

### 1. **index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crop Yield AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- **Purpose**: HTML shell; loads the React app via Vite's module script.
- **Mount Point**: `div#root`

### 2. **src/main.tsx**

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </BrowserRouter>
);
```

- **Purpose**: React 18 entry point; wraps `App` with routing and i18n context.
- **Providers**:
  - `BrowserRouter`: Enables client-side routing
  - `LanguageProvider`: Manages English/Hindi translations

### 3. **src/App.tsx**

- **Purpose**: Root layout component containing:
  - **Header**: Logo, app title, login/logout button, navigation bar
  - **Main Content**: Route-based component rendering
  - **Footer**: Platform info, features, tech stack, benefits
  - **Floating Demo Helper**: Quick guide tooltip
  - **AuthModal**: Login/register modal overlay

- **Routes**:
  ```tsx
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/weather" element={<Weather />} />
    <Route path="/yield" element={<YieldPrediction />} />
    <Route path="/recommendation" element={<CropRecommendation />} />
    <Route path="/optimization" element={<FertilizerOptimization />} />
    <Route path="/risk" element={<RiskPrediction />} />
    <Route path="/simulator" element={<WhatIfSimulator />} />
    <Route path="/explainable" element={<ExplainableAI />} />
  </Routes>
  ```

---

## 🧭 Routing & Navigation

**React Router v6** handles all navigation with declarative `<Route>` elements.

| Path | Component | Purpose |
|------|-----------|---------|
| `/`, `/dashboard` | `Dashboard` | Overview metrics, charts, quick actions |
| `/weather` | `Weather` | Real-time weather + farming tips |
| `/yield` | `YieldPrediction` | Predict crop yield with ML |
| `/recommendation` | `CropRecommendation` | Get crop suggestions |
| `/optimization` | `FertilizerOptimization` | Optimize N/P/K and irrigation |
| `/risk` | `RiskPrediction` | Assess weather/soil/disease risks |
| `/simulator` | `WhatIfSimulator` | Test scenario variations |
| `/explainable` | `ExplainableAI` | Understand feature importance |

**Navigation Bar**: Rendered in `App.tsx` header; uses `<NavLink>` for active state styling.

---

## 🌐 Context & State Management

### LanguageContext (`src/context/LanguageContext.tsx`)

**Purpose**: Centralized internationalization (i18n) for English and Hindi.

**API**:
```tsx
const { lang, setLang, t } = useI18n();
// lang: 'en' | 'hi'
// t(key): returns localized string
```

**Storage**: Language preference persisted in `localStorage`.

**Translation Keys**: 200+ keys covering UI labels, messages, form fields, etc.

**Usage Example**:
```tsx
<h1>{t('appTitle')}</h1>  // "AgroAI Platform" or "एग्रोएआई प्लेटफ़ॉर्म"
```

---

## 🎨 Core Components

### 1. **Dashboard** (`src/components/Dashboard.tsx`)

**Purpose**: Main landing view showing platform overview.

**Features**:
- **Key Metrics Cards**: Total predictions, avg yield, success rate, active farmers
- **Charts** (using Recharts):
  - Line chart: Yield trend over 6 months
  - Pie chart: Crop distribution
  - Bar chart: Risk level distribution
- **Recent Predictions Table**: Latest 4 predictions with risk badges
- **Quick Action Cards**: Links to Yield Prediction, Crop Recommendation, Simulator
- **Platform Benefits**: 4-column grid of value propositions
- **Weather Widget**: Embedded weather display

**Data Source**:
- Fetches `predictionAPI.getDashboardStats()` on mount
- Shows public data if not logged in
- Mock data fallback on error

---

### 2. **YieldPrediction** (`src/components/YieldPrediction.tsx`)

**Purpose**: Predict crop yield based on field parameters.

**Form Inputs**:
- Crop selection (rice, wheat, corn, etc.)
- Soil nutrients: Nitrogen, Phosphorus, Potassium (kg/ha)
- Soil characteristics: Type, Color, Waterlogging tendency
- Weather: Rainfall (mm), Temperature (°C)

**Auto-calculation**:
- Estimates soil pH category from soil type/color/waterlogging

**Output Display**:
- Predicted yield (kg/hectare)
- Risk level (Low/Medium/High) with color-coded badge
- Model confidence percentage (with progress bar)
- Contributing factors: Soil health, Weather suitability, Nutrient balance

**ML Engine**:
- Uses `predictCropYield()` from `mockMLModels.ts`
- Can be swapped with backend API call

---

### 3. **CropRecommendation** (`src/components/CropRecommendation.tsx`)

**Purpose**: Suggest best crops for given soil and climate conditions.

**Inputs**:
- Soil nutrients (N/P/K)
- pH level
- Rainfall and temperature

**Output**:
- Top 3 crop recommendations
- Match percentage (0-100%)
- Expected yield (kg/ha)
- Visual ranking with badges

**ML Engine**: `recommendCrops()` from mock models

---

### 4. **FertilizerOptimization** (`src/components/FertilizerOptimization.tsx`)

**Purpose**: Optimize resource usage for cost savings.

**Features**:
- **Current vs Optimized**: Side-by-side comparison
- **Resource Types**: Nitrogen, Phosphorus, Potassium, Irrigation Water
- **Metrics**: Usage amount, cost per unit, estimated total cost
- **Savings Calculation**: Shows potential cost reduction
- **Optimization Report**: Text recommendations

---

### 5. **RiskPrediction** (`src/components/RiskPrediction.tsx`)

**Purpose**: Assess cultivation risks before planting.

**Risk Factors**:
- Weather Risk (temperature extremes, rainfall patterns)
- Soil Risk (nutrient deficiencies, pH imbalance)
- Disease Risk (humidity, temperature conducive to pests)

**Output**:
- Overall risk score (0-100)
- Risk level classification (Low/Medium/High)
- Risk trend analysis chart
- Factor-wise breakdown

---

### 6. **WhatIfSimulator** (`src/components/WhatIfSimulator.tsx`)

**Purpose**: Test different scenarios and compare outcomes.

**Features**:
- Baseline input form (same as YieldPrediction)
- Scenario editor to modify parameters
- Side-by-side yield comparison
- Factor comparison chart
- Change impact indicators (↑↓)

**Use Case**: "What if I increase nitrogen by 20%? How will yield change?"

---

### 7. **ExplainableAI** (`src/components/ExplainableAI.tsx`)

**Purpose**: Transparency into ML model decision-making.

**Features**:
- **Feature Importance Chart**: Horizontal bar chart showing which factors most affect yield
- **Top Factors List**: Ranked list with percentages
- **AI Explanation**: Natural language description of key drivers
- **How It Works**: Educational section on model training

**Data Source**: `calculateFeatureImportance()` from mock models

---

### 8. **Weather** (`src/components/Weather.tsx`)

**Purpose**: Full weather page with forecasts and farming tips.

**Sections**:
- Header with description
- WeatherWidget (with 5-day forecast enabled)
- **Weather-Based Farming Tips**: 4 guides (Temperature, Humidity, Rainfall, Wind)
- **Weather Alerts**: Color-coded advisories (heat wave, rainfall, favorable)
- **Best Practices**: Daily monitoring and action planning
- **Setup Instructions**: How to configure OpenWeatherMap API

---

### 9. **WeatherWidget** (`src/components/WeatherWidget.tsx`)

**Purpose**: Reusable weather display component.

**Props**:
- `city?: string` (default: "Mumbai")
- `showForecast?: boolean` (default: false)

**Features**:
- Location search input
- Current location button (GPS stub)
- Main weather card: Temperature, description, emoji
- Detail grid: Humidity, Precipitation, Pressure, Wind speed
- Sunrise/Sunset times
- Farming advice based on current conditions
- 5-day forecast (optional)
- API configuration warning in demo mode

**Data Source**:
- `getCurrentWeather()` and `getWeatherForecast()` from `weatherAPI.ts`
- Falls back to `getMockWeatherData()` if API key missing

---

### 10. **AuthModal** (`src/components/AuthModal.tsx`)

**Purpose**: Multi-mode authentication modal overlay.

**Modes**:
- `login`: Email + password sign-in
- `register`: Full registration form (name, email, Aadhar, password)
- `forgot`: Password recovery (email input)
- `reset`: New password entry

**Props**:
```tsx
interface AuthModalProps {
  open: boolean;
  mode: 'login' | 'register' | 'forgot' | 'reset' | null;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onLoginSuccess: () => void;
}
```

**Validation**:
- Email regex check
- Aadhar number must be 12 digits
- Password confirmation match
- Error/success message display

**API Integration**:
- `authAPI.login()` → saves token + user to localStorage
- `authAPI.register()` → then switches to login mode
- Blocks body scroll when open

---

## 🔧 Utility Modules

### 1. **api.ts** (`src/utils/api.ts`)

**Purpose**: Centralized HTTP client for backend communication.

**Base URL**: `import.meta.env.VITE_API_URL` or `http://localhost:5000/api`

**Token Management**:
```tsx
setAuthToken(token: string)
getAuthToken(): string | null
clearAuthToken()
```

**API Namespaces**:

#### authAPI
```tsx
authAPI.register(userData)
authAPI.login(credentials)
authAPI.getProfile()
authAPI.updateProfile(data)
authAPI.changePassword(data)
authAPI.deleteAccount()
authAPI.logout()
authAPI.sendOTP(data)
authAPI.verifyOTP(data)
```

#### predictionAPI
```tsx
predictionAPI.predictYield(inputData)
predictionAPI.predictCrop(inputData)
predictionAPI.predictRisk(inputData)
predictionAPI.getHistory()
predictionAPI.getDashboardStats()
```

#### Health Check
```tsx
healthCheck(): Promise<boolean>
```

**Request Flow**:
1. Build headers with `Content-Type: application/json`
2. Add `Authorization: Bearer <token>` if available
3. Fetch endpoint
4. Parse JSON response
5. Throw error if `!response.ok`

---

### 2. **weatherAPI.ts** (`src/utils/weatherAPI.ts`)

**Purpose**: OpenWeatherMap API integration.

**Configuration**:
```tsx
const WEATHER_API_KEY = '0631ebab3ea49ee94c131059261201';  // Replace with your key
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
```

**Main Functions**:

```tsx
// Current weather by city name
getCurrentWeather(city: string): Promise<WeatherData | null>

// Current weather by GPS coordinates
getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData | null>

// 5-day forecast
getWeatherForecast(city: string): Promise<WeatherForecast[]>
```

**Helper Functions**:
```tsx
getWeatherIconUrl(icon: string): string
getWeatherEmoji(description: string): string  // Returns ☀️🌧️⛈️ etc.
formatTime(timestamp: number): string
getFarmingAdvice(weather: WeatherData): string
getMockWeatherData(): WeatherData
isWeatherAPIConfigured(): boolean
```

**Data Interfaces**:
```tsx
interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;  // km/h
  precipitation: number;  // mm
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  cloudiness: number;
}

interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
  humidity: number;
}
```

**Demo Mode**: If API key not configured, returns mock data.

---

### 3. **mockMLModels.ts** (`src/utils/mockMLModels.ts`)

**Purpose**: Client-side mock ML predictions for demo/offline mode.

**Constants**:
```tsx
CROP_DATABASE: {
  rice: { idealN: 80, idealP: 40, idealK: 40, idealPH: 6.5, ... },
  wheat: { ... },
  // 10+ crops
}
```

**Functions**:

#### predictCropYield
```tsx
predictCropYield(input: PredictionInput): {
  predictedYield: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  confidence: number;
  factors: {
    soilHealth: number;
    weatherSuitability: number;
    nutrientBalance: number;
  };
}
```

#### recommendCrops
```tsx
recommendCrops(input: Partial<PredictionInput>): Array<{
  crop: string;
  matchScore: number;
  expectedYield: number;
  reason: string;
}>
```

#### predictWeatherRisk
```tsx
predictWeatherRisk(input: PredictionInput): {
  riskLevel: string;
  riskScore: number;
  factors: { weatherRisk, soilRisk, diseaseRisk };
}
```

#### estimateSoilPH
```tsx
estimateSoilPH(soilType, soilColor, waterlogging): 'Acidic' | 'Neutral' | 'Alkaline'
```

#### calculateFeatureImportance
```tsx
calculateFeatureImportance(input: PredictionInput): Array<{
  feature: string;
  importance: number;
}>
```

**Algorithm**: Rule-based logic mimicking ML behavior with randomness for demo realism.

---

## 🎨 UI Component Library

The `src/components/ui/` directory contains **45+ reusable UI components** based on Radix UI primitives and shadcn/ui patterns. These are generic, unstyled (or lightly styled) building blocks.

### Categories

#### Layout
- `card.tsx` - Container with header/footer slots
- `separator.tsx` - Horizontal/vertical divider
- `accordion.tsx` - Collapsible sections
- `collapsible.tsx` - Toggle content visibility
- `tabs.tsx` - Tab navigation
- `scroll-area.tsx` - Custom scrollbar styling
- `resizable.tsx` - Draggable panel resizing
- `sidebar.tsx` - Collapsible sidebar layout
- `drawer.tsx` - Slide-out panel
- `sheet.tsx` - Modal side panel

#### Navigation
- `breadcrumb.tsx` - Breadcrumb trail
- `menubar.tsx` - Menu bar component
- `navigation-menu.tsx` - Multi-level nav
- `pagination.tsx` - Page controls

#### Forms
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line text
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button group
- `switch.tsx` - Toggle switch
- `slider.tsx` - Range slider
- `input-otp.tsx` - OTP input
- `form.tsx` - Form wrapper with validation
- `label.tsx` - Form label

#### Overlays
- `dialog.tsx` - Modal dialog
- `alert-dialog.tsx` - Confirmation dialog
- `popover.tsx` - Floating content
- `tooltip.tsx` - Hover tooltips
- `hover-card.tsx` - Rich hover content
- `context-menu.tsx` - Right-click menu
- `dropdown-menu.tsx` - Dropdown actions

#### Feedback
- `alert.tsx` - Alert banner
- `progress.tsx` - Progress bar
- `skeleton.tsx` - Loading placeholder
- `sonner.tsx` - Toast notifications
- `badge.tsx` - Status badge

#### Display
- `avatar.tsx` - User avatar
- `aspect-ratio.tsx` - Aspect ratio container
- `carousel.tsx` - Image carousel
- `table.tsx` - Data table
- `chart.tsx` - Chart wrappers

#### Actions
- `button.tsx` - Button component
- `toggle.tsx` - Toggle button
- `toggle-group.tsx` - Button group
- `command.tsx` - Command palette

#### Utilities
- `utils.ts` - Tailwind class merger (cn function)
- `use-mobile.ts` - Mobile detection hook
- `calendar.tsx` - Date picker

**Usage Pattern**:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>
    <Button variant="primary">Click Me</Button>
  </CardContent>
</Card>
```

---

## 🔄 Data Flow

### Prediction Flow

```
User Input (Form)
    ↓
Component State (useState)
    ↓
Mock ML Model OR Backend API
    ↓
Result Display (Charts, Cards)
```

### Authentication Flow

```
User submits AuthModal
    ↓
authAPI.login() → Backend
    ↓
Receives { access_token, user }
    ↓
Store in localStorage
    ↓
Update App.tsx header state
    ↓
Show Welcome + Logout button
```

### Weather Flow

```
WeatherWidget mounts
    ↓
Check isWeatherAPIConfigured()
    ↓
[YES] → getCurrentWeather() → OpenWeatherMap API
[NO]  → getMockWeatherData()
    ↓
Update state & render
```

### Dashboard Stats Flow

```
Dashboard mounts
    ↓
predictionAPI.getDashboardStats()
    ↓
Backend returns { total_predictions, avg_yield, ... }
    ↓
Update metrics cards
    ↓
Render charts with Recharts
```

---

## 🔐 Authentication

**Storage**: JWT token and user object stored in `localStorage`.

**Keys**:
- `authToken`: JWT access token
- `currentUser`: JSON string of `{ id, name, email, ... }`

**Protected Routes**: None enforced at routing level; components check token and adapt UI.

**Login Flow**:
1. User enters credentials in AuthModal
2. `authAPI.login()` sends POST to `/api/auth/login`
3. Backend validates and returns `{ access_token, user }`
4. Frontend stores both in localStorage
5. Header re-renders to show user name and Logout button

**Logout Flow**:
1. User clicks Logout
2. `authAPI.logout()` clears localStorage
3. Navigate to `/`
4. Header shows Login button

**Token Usage**:
- `api.ts` `makeRequest()` automatically adds `Authorization: Bearer <token>` header if token exists

---

## 🌍 Internationalization (i18n)

**Supported Languages**: English (`en`), Hindi (`hi`)

**Implementation**: `LanguageContext` with 400+ translation keys.

**Language Toggle**: (Planned but not visible in current UI; can be added to header)

**Key Coverage**:
- UI labels (buttons, links, headings)
- Form fields and validation messages
- Error/success messages
- Dashboard metrics
- Weather tips
- Modal titles

**Translation Example**:
```tsx
// English
appTitle: 'AgroAI Platform'
yieldPrediction: 'Yield Prediction'

// Hindi
appTitle: 'एग्रोएआई प्लेटफ़ॉर्म'
yieldPrediction: 'उत्पादन पूर्वानुमान'
```

**Usage**:
```tsx
const { t } = useI18n();
<h1>{t('appTitle')}</h1>
```

**Persistence**: User preference saved to `localStorage` with key `lang`.

---

## 🚧 Development & Build

### Configuration (`vite.config.ts`)

```tsx
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ... 30+ package aliases
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### Scripts (from `package.json`)

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build → build/
npm run preview    # Preview production build
npm run lint       # Run ESLint (if configured)
```

### Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

Access in code:
```tsx
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

### Dependencies (Key)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.x",
  "recharts": "^2.15.2",
  "tailwindcss": "^3.4.x",
  "@radix-ui/*": "Multiple packages for UI primitives",
  "lucide-react": "Icon library (if used)",
  "class-variance-authority": "Variant styling",
  "clsx": "Class name utility",
  "sonner": "Toast notifications"
}
```

---

## 📊 Component Dependency Graph

```
App
├── Header (inline)
│   └── AuthModal
├── Routes
│   ├── Dashboard
│   │   └── WeatherWidget
│   ├── Weather
│   │   └── WeatherWidget (with forecast)
│   ├── YieldPrediction
│   ├── CropRecommendation
│   ├── FertilizerOptimization
│   ├── RiskPrediction
│   ├── WhatIfSimulator
│   └── ExplainableAI
└── Footer (inline)
```

**Shared Dependencies**:
- All components use `useI18n()` for translations
- Charts use Recharts components
- Forms use `ui/` components (input, button, select, etc.)
- API calls use `utils/api.ts` or `utils/mockMLModels.ts`

---

## 🔑 Key Features Summary

| Feature | Component | Tech | Status |
|---------|-----------|------|--------|
| Dashboard Overview | `Dashboard` | Recharts | ✅ Complete |
| Yield Prediction | `YieldPrediction` | Mock ML | ✅ Complete |
| Crop Recommendation | `CropRecommendation` | Mock ML | ✅ Complete |
| Weather Integration | `Weather`, `WeatherWidget` | OpenWeatherMap API | ✅ Complete |
| Risk Assessment | `RiskPrediction` | Mock ML | ✅ Complete |
| Resource Optimization | `FertilizerOptimization` | Mock calculations | ✅ Complete |
| What-If Simulator | `WhatIfSimulator` | Mock ML | ✅ Complete |
| Explainable AI | `ExplainableAI` | Feature importance | ✅ Complete |
| Authentication | `AuthModal`, `api.ts` | JWT + Backend | ✅ Complete |
| Internationalization | `LanguageContext` | English + Hindi | ✅ Complete |
| Responsive Design | Tailwind CSS | Mobile-first | ✅ Complete |

---

## 🎯 Best Practices

1. **Component Structure**:
   - Keep feature components in `src/components/`
   - Keep generic UI in `src/components/ui/`
   - Use TypeScript interfaces for props

2. **State Management**:
   - Use local `useState` for component state
   - Use Context for global state (language, theme)
   - Avoid prop drilling with Context

3. **API Integration**:
   - Centralize all API calls in `utils/api.ts`
   - Use try-catch for error handling
   - Show loading states during async operations

4. **Styling**:
   - Use Tailwind utility classes
   - Extract common patterns to `ui/` components
   - Use `cn()` utility for conditional classes

5. **Performance**:
   - Lazy load routes if app grows
   - Memoize expensive calculations with `useMemo`
   - Debounce search inputs

6. **Testing** (Recommended):
   - Unit tests for utilities (`api.ts`, `mockMLModels.ts`)
   - Component tests with React Testing Library
   - E2E tests with Playwright/Cypress

---

## 🐛 Troubleshooting

### Weather Widget shows "Demo Mode"
**Solution**: Add OpenWeatherMap API key in `src/utils/weatherAPI.ts`:
```tsx
const WEATHER_API_KEY = 'your_actual_api_key_here';
```

### Login fails with network error
**Solution**: Ensure backend is running on `http://localhost:5000` or update `VITE_API_URL` in `.env`.

### Language not persisting
**Solution**: Check browser localStorage permissions; LanguageContext saves to `localStorage.lang`.

### Charts not rendering
**Solution**: Ensure Recharts is installed: `npm install recharts`

### Build fails
**Solution**: Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Additional Resources

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Recharts**: https://recharts.org
- **Radix UI**: https://radix-ui.com
- **OpenWeatherMap API**: https://openweathermap.org/api

---

## 🤝 Contributing

When adding new features:
1. Create component in `src/components/`
2. Add route in `src/App.tsx`
3. Update translations in `LanguageContext.tsx`
4. Add API endpoint in `utils/api.ts` (if needed)
5. Document in this file

---

**Last Updated**: January 14, 2026  
**Version**: 1.0  
**Maintained by**: Neurovia AI Team
