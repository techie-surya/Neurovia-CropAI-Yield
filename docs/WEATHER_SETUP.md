# Weather API Setup Guide

## Overview

Neurovia integrates real-time weather data to enhance agricultural predictions and provide farmers with actionable insights. The weather integration uses OpenWeatherMap API to fetch current conditions, forecasts, and location-based data.

## Prerequisites

- Active internet connection
- OpenWeatherMap API account (free tier available)
- Access to project codebase

## Quick Setup (3 Steps)

### Step 1: Create OpenWeatherMap Account

1. Visit [OpenWeatherMap API](https://openweathermap.org/api)
2. Click **"Sign Up"** in the top right corner
3. Fill in registration details:
   - Email address
   - Password
   - Company: "Student Project" or "Personal"
   - Purpose: "Education"
4. Verify your email address
5. Login to your dashboard

### Step 2: Get Your API Key

1. After login, navigate to **API Keys** section
2. You'll see a default API key already generated
3. **Copy the API key** (looks like: `abc123def456xyz789`)
4. **Note:** API key activation can take 1-2 hours

**Free Tier Includes:**
- ✅ 1,000 API calls per day
- ✅ Current weather data
- ✅ 5-day/3-hour forecast
- ✅ 60 calls per minute
- ✅ No credit card required

### Step 3: Configure API Key in Project

**Option A: Environment Variable (Recommended)**

Create or update `.env` file in project root:

```env
# Weather API Configuration
VITE_WEATHER_API_KEY=your_actual_api_key_here
```

Then update `src/utils/weatherAPI.ts`:

```typescript
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
```

**Option B: Direct Configuration**

Edit `src/utils/weatherAPI.ts` (line ~7):

```typescript
// Before
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';

// After
const WEATHER_API_KEY = 'abc123def456xyz789';  // Your actual key
```

**Save the file and restart your development server.**

## Testing the Integration

### 1. Verify Weather Widget

1. Start the development server: `npm run dev`
2. Navigate to the **Dashboard** page
3. Scroll to the bottom - you should see the weather widget
4. If showing "Demo Mode", wait 1-2 hours for API activation

### 2. Test Location Search

1. Click on the **Weather** tab
2. Use the search bar to enter a city name (e.g., "Delhi")
3. Click search or press Enter
4. Weather data should update with the new location

### 3. Test Current Location

1. Click the **"Use Current Location"** button
2. Browser will request location permission - click **Allow**
3. Weather should update based on your GPS coordinates

### 4. Verify Forecast

1. Scroll down on the Weather page
2. You should see a 5-day weather forecast
3. Each day shows temperature, conditions, humidity, and wind

## Features Overview

### Weather Widget (`src/components/WeatherWidget.tsx`)

Displays:
- 🌡️ Current temperature (°C or °F)
- 📍 Location (City, Country)
- 🌤️ Weather description with icon
- 💧 Humidity percentage
- 🌧️ Precipitation amount
- 🌡️ Atmospheric pressure (hPa)
- 💨 Wind speed (m/s or mph)
- 🌅 Sunrise time
- 🌇 Sunset time
- 🌾 Farming advice based on conditions

### Weather Page (`src/components/Weather.tsx`)

Features:
- Full weather widget integration
- 5-day/3-hour weather forecast
- Temperature farming guidelines
- Humidity management tips
- Rainfall preparation advice
- Wind speed considerations
- Weather alerts and warnings
- Location search and GPS support

## API Endpoints Used

### Current Weather Data

```
GET https://api.openweathermap.org/data/2.5/weather
Parameters:
  - q: City name (e.g., "Mumbai,IN")
  - appid: Your API key
  - units: metric (Celsius) or imperial (Fahrenheit)
```

### 5-Day Forecast

```
GET https://api.openweathermap.org/data/2.5/forecast
Parameters:
  - q: City name
  - appid: Your API key
  - units: metric
```

### Geocoding (Coordinates to Location)

```
GET https://api.openweathermap.org/data/2.5/weather
Parameters:
  - lat: Latitude
  - lon: Longitude
  - appid: Your API key
  - units: metric
```

## Supported Locations

OpenWeatherMap supports:
- ✅ 200,000+ cities worldwide
- ✅ Search by city name
- ✅ Search by coordinates (lat/lon)
- ✅ International weather data
- ✅ Multiple languages

**Popular Indian Cities:**
Mumbai, Delhi, Bangalore, Chennai, Pune, Hyderabad, Ahmedabad, Kolkata, Jaipur, Lucknow, Chandigarh, Bhopal, Patna, Indore, Nagpur, and more.

## Integration with Predictions

### Weather + Risk Assessment

Weather data enhances risk predictions:

```typescript
const weatherData = await getCurrentWeather(location);

// Flood risk assessment
if (weatherData.precipitation > 50) {
  riskLevel = 'HIGH';
  recommendations.push('Heavy rainfall expected - ensure proper drainage');
}

// Drought risk assessment
if (weatherData.precipitation < 5 && weatherData.humidity < 40) {
  riskLevel = 'HIGH';
  recommendations.push('Low rainfall - consider irrigation');
}

// Heat stress assessment
if (weatherData.temperature > 35) {
  riskLevel = 'MEDIUM';
  recommendations.push('High temperatures - ensure adequate watering');
}
```

### Weather + Yield Prediction

Integrate current weather into yield calculations:

```typescript
const weatherData = await getCurrentWeather(location);
const monthlyRainfall = weatherData.precipitation * 30;

const yieldPrediction = await predictYield({
  ...inputData,
  rainfall: monthlyRainfall,
  temperature: weatherData.temperature,
  humidity: weatherData.humidity
});
```

## Customization

### Change Default Location

Edit `src/components/WeatherWidget.tsx`:

```typescript
const [locationInput, setLocationInput] = useState('Delhi');  // Change default city
```

### Customize Weather Backgrounds

Edit `getWeatherBackground` function in `WeatherWidget.tsx`:

```typescript
const getWeatherBackground = (description: string) => {
  const lower = description.toLowerCase();
  
  if (lower.includes('clear')) return 'from-yellow-400 to-orange-400';
  if (lower.includes('cloud')) return 'from-gray-400 to-gray-600';
  if (lower.includes('rain')) return 'from-blue-400 to-indigo-500';
  if (lower.includes('thunder')) return 'from-purple-500 to-pink-600';
  
  return 'from-cyan-400 to-blue-500';
};
```

### Customize Farming Advice

Edit `src/utils/weatherAPI.ts`, `getFarmingAdvice` function:

```typescript
export function getFarmingAdvice(weather: WeatherData): string {
  const temp = weather.temperature;
  const humidity = weather.humidity;
  const rainfall = weather.precipitation;

  if (temp > 35) {
    return '🔥 High temperature alert! Provide shade for crops and increase irrigation.';
  }
  
  if (humidity > 80 && rainfall > 10) {
    return '💧 High humidity and rainfall - monitor for fungal diseases.';
  }
  
  if (temp < 15) {
    return '❄️ Cool weather - protect sensitive crops from cold stress.';
  }

  // Add more custom conditions
  return '✅ Weather conditions are favorable for farming activities.';
}
```

## Troubleshooting

### Issue: "Unable to load weather data"

**Solutions:**
1. Verify API key is correct (no extra spaces)
2. Wait 1-2 hours after creating account (API key activation time)
3. Check internet connection
4. Try different city name or use GPS
5. Open browser console (F12) and check for specific errors

### Issue: "Demo Mode" persists

**Solutions:**
1. Ensure file is saved after adding API key
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh page (Ctrl+F5)
4. Restart development server
5. Check API key format:
   - ✅ Correct: `'abc123def456'`
   - ❌ Wrong: `''abc123def456''` or `'abc 123 def 456'`

### Issue: City not found

**Solutions:**
1. Use English spelling (e.g., "Mumbai" not "Bombay")
2. Add country code: "Delhi,IN"
3. Try major city nearby
4. Use GPS location button instead
5. Check city name spelling

### Issue: API limit exceeded

**Solutions:**
1. Free tier: 1,000 calls/day, 60 calls/minute
2. Cache weather data to reduce calls
3. Use manual refresh instead of auto-refresh
4. Upgrade to paid tier if needed

## API Rate Limits & Best Practices

### Free Tier Limits
- **Daily:** 1,000 API calls
- **Per Minute:** 60 API calls
- **Update Frequency:** Data updates every 10 minutes

### Best Practices

1. **Cache Weather Data**
   ```typescript
   // Store weather data with timestamp
   const cachedWeather = {
     data: weatherData,
     timestamp: Date.now()
   };
   
   // Refresh only if older than 10 minutes
   const isCacheValid = (Date.now() - cachedWeather.timestamp) < 600000;
   ```

2. **Handle Errors Gracefully**
   ```typescript
   try {
     const weather = await getCurrentWeather(city);
     setWeatherData(weather);
   } catch (error) {
     console.error('Weather fetch failed:', error);
     // Fall back to demo/cached data
     setWeatherData(demoWeatherData);
   }
   ```

3. **Show Last Updated Time**
   ```typescript
   <p>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</p>
   ```

4. **Implement Loading States**
   ```typescript
   const [isLoading, setIsLoading] = useState(false);
   
   // Show spinner while fetching
   if (isLoading) return <LoadingSpinner />;
   ```

## Advanced Features

### Weather History Tracking

```typescript
const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([]);

const trackWeather = (data: WeatherData) => {
  setWeatherHistory(prev => [...prev, {
    ...data,
    timestamp: Date.now()
  }]);
};
```

### Weather-Based Alerts

```typescript
const checkWeatherAlerts = (weather: WeatherData) => {
  const alerts = [];
  
  if (weather.temperature > 40) {
    alerts.push({
      level: 'CRITICAL',
      message: 'Extreme heat alert! Immediate action required.'
    });
  }
  
  if (weather.precipitation > 100) {
    alerts.push({
      level: 'WARNING',
      message: 'Heavy rainfall expected - prepare flood defenses.'
    });
  }
  
  return alerts;
};
```

### Multiple Location Monitoring

```typescript
const farmLocations = ['Delhi', 'Mumbai', 'Chennai'];

const getAllFarmWeather = async () => {
  const weatherPromises = farmLocations.map(city => 
    getCurrentWeather(city)
  );
  
  const allWeather = await Promise.all(weatherPromises);
  return allWeather;
};
```

## Demo Mode

If API key is not configured, the app runs in **Demo Mode**:

- ✅ Shows realistic mock weather data
- ✅ All UI components functional
- ✅ Good for testing and presentations
- ❌ Data is static (not real-time)

**Mock Data Includes:**
- Temperature: 28°C
- Location: Mumbai, IN
- Humidity: 65%
- Conditions: Partly cloudy
- Realistic sunrise/sunset times

## API Documentation Reference

- **Current Weather:** https://openweathermap.org/current
- **5-Day Forecast:** https://openweathermap.org/forecast5
- **Weather Conditions & Icons:** https://openweathermap.org/weather-conditions
- **API Guide:** https://openweathermap.org/guide
- **Pricing Plans:** https://openweathermap.org/price

## Benefits for Farmers

### Real-Time Weather Integration Provides:

1. **Accurate Planning** - Plan farming activities based on live weather
2. **Risk Mitigation** - Early warnings for extreme weather
3. **Irrigation Management** - Know when to water crops
4. **Harvest Timing** - Choose optimal harvest windows
5. **Disease Prevention** - Anticipate fungal/pest issues from humidity
6. **Resource Optimization** - Save water and energy

## For Hackathon Presentation

### Key Points to Highlight:

1. **Live Weather Integration**
   - "We integrate real-time weather data from OpenWeatherMap API"
   
2. **Location Flexibility**
   - "Farmers can search any city or use GPS for their exact location"
   
3. **Smart Farming Advice**
   - "AI analyzes current weather and provides actionable recommendations"
   
4. **5-Day Forecast**
   - "Helps farmers plan ahead with weather predictions"
   
5. **Enhanced Predictions**
   - "Weather data improves accuracy of our risk and yield predictions"

### Demo Script:

1. Open Weather tab
2. Show current conditions
3. Search different location
4. Point out farming advice
5. Scroll to 5-day forecast
6. Explain integration with risk assessment

## Security Considerations

1. **Never commit API keys** to version control
2. Use environment variables for sensitive data
3. Add `.env` to `.gitignore`
4. Rotate API keys periodically
5. Monitor API usage in OpenWeatherMap dashboard
6. Use server-side proxy in production to hide API keys

## Next Steps

After setup:

1. ✅ Test all weather features
2. ✅ Verify location search works
3. ✅ Check forecast accuracy
4. ✅ Integrate with prediction models
5. ✅ Add custom farming advice
6. ✅ Test error handling

## Support

**OpenWeatherMap Support:**
- Documentation: https://openweathermap.org/api
- FAQ: https://openweathermap.org/faq
- Contact: https://openweathermap.org/appid

**Project Issues:**
- Check browser console for errors
- Verify API key activation status
- Test with different locations
- Review code in `src/utils/weatherAPI.ts`

---

**Status:** Ready for Production  
**Last Updated:** January 2026  
**API Version:** 2.5
