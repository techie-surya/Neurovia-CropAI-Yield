import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, MapPin, CloudRain, Thermometer, Droplets, X, RefreshCw, RotateCcw } from 'lucide-react';

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface ForecastDay {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
}

interface CurrentWeather {
  temperature: number;
  humidity: number;
  rainfall: number;
  timestamp: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

// ============================================================================
// GEOCODING UTILITIES
// ============================================================================

const geocodeLocation = async (location: string): Promise<{ lat: number; lon: number }> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)},India&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'CropPredictionApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    if (data.length === 0) {
      throw new Error('Location not found. Please enter a valid pincode or district name.');
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to convert location to coordinates');
  }
};

const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'CropPredictionApp/1.0',
        },
      }
    );

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
};

// ============================================================================
// OPENWEATHERMAP API - Real-time accurate weather
// ============================================================================

const WEATHER_API_KEY = 'babf0f4e684e15176c2fc62d0a394fac';
const OPEN_WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetches real-time weather using OpenWeatherMap API
 */
const fetchOpenWeatherData = async (lat: number, lon: number): Promise<{
  temperature: number;
  humidity: number;
  rainfall: number;
  description: string;
} | null> => {
  try {
    const response = await fetch(
      `${OPEN_WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenWeatherMap');
    }

    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      rainfall: data?.rain?.['1h'] ?? 0,
      description: data.weather[0].description,
    };
  } catch (error) {
    console.error('OpenWeatherMap error:', error);
    return null;
  }
};

/**
 * Fetches forecast using OpenWeatherMap API
 */
const fetchWeatherForecastData = async (lat: number, lon: number): Promise<ForecastDay[] | null> => {
  try {
    const response = await fetch(
      `${OPEN_WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error('Failed to fetch forecast');

    const data = await response.json();
    const dailyData: { [key: string]: any } = {};

    // Group data by date and aggregate (max, min, sum)
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-CA');
      if (!dailyData[date]) {
        dailyData[date] = {
          date: item.dt * 1000,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          precipitation: item?.rain?.['3h'] ?? 0,
        };
      } else {
        dailyData[date].tempMax = Math.max(dailyData[date].tempMax, item.main.temp_max);
        dailyData[date].tempMin = Math.min(dailyData[date].tempMin, item.main.temp_min);
        dailyData[date].precipitation += item?.rain?.['3h'] ?? 0;
      }
    });

    // Convert to array, limit to 14 days, and return with unique dates
    const forecastArray = Object.values(dailyData)
      .slice(0, 14)
      .map((day: any) => ({
        date: new Date(day.date).toISOString().split('T')[0],
        temperatureMax: Math.round(day.tempMax * 10) / 10,
        temperatureMin: Math.round(day.tempMin * 10) / 10,
        precipitationSum: Math.round(day.precipitation * 10) / 10,
      }));

    // Remove any potential duplicates by date
    const uniqueForecast = Array.from(
      new Map(forecastArray.map(item => [item.date, item])).values()
    );

    return uniqueForecast;
  } catch (error) {
    console.error('Forecast error:', error);
    return null;
  }
};
// ============================================================================
// MODAL COMPONENT - Location Permission Popup
// ============================================================================

interface LocationModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onCancel: () => void;
  onManualInput: (location: string) => void;
  isLoading: boolean;
  manualLocation: string;
  setManualLocation: (location: string) => void;
  error?: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onAllow,
  onCancel,
  onManualInput,
  isLoading,
  manualLocation,
  setManualLocation,
  error,
}) => {
  if (!isOpen) return null;

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 1rem',
          padding: '1.5rem',
          position: 'relative',
          zIndex: 100000
        }}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Modal Content */}
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Enable Location Access</h2>
          <p className="text-center text-gray-600 text-sm">
            Allow access to your location so we can fetch accurate weather data for your area automatically.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onAllow}
            className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="font-medium">Allow Location</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AutoWeatherFetcherProps {
  onWeatherDataFetched?: (data: WeatherData) => void;
  showDetailedView?: boolean;
  autoShowModal?: boolean;
}

const WEATHER_CACHE_KEY = 'autoWeatherCache';
const WEATHER_MODAL_STATE_KEY = 'autoWeatherModalState'; // 'open' | 'closed' | 'resolved'

const AutoWeatherFetcher: React.FC<AutoWeatherFetcherProps> = ({
  onWeatherDataFetched,
  showDetailedView = true,
  autoShowModal = true,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentTemperature, setCurrentTemperature] = useState<number>();
  const [currentHumidity, setCurrentHumidity] = useState<number>();
  const [currentRainfall, setCurrentRainfall] = useState<number>();
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [displayTime, setDisplayTime] = useState<string>(new Date().toLocaleString());
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(autoShowModal);
  const [manualLocation, setManualLocation] = useState<string>('');
  const [weatherFetched, setWeatherFetched] = useState<boolean>(false);

  // ============================================================================
  // EFFECT: Track showModal state changes
  // ============================================================================

  useEffect(() => {
    console.log('[EFFECT] showModal state changed to:', showModal);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEATHER_MODAL_STATE_KEY, showModal ? 'open' : 'closed');
      }
    } catch (err) {
      console.warn('[CACHE] Failed to persist modal state', err);
    }
  }, [showModal]);

  // ============================================================================
  // EFFECT: Hydrate from cache on mount to persist across navigation
  // ============================================================================

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (autoShowModal) {
        // Explicit request to show modal (e.g., GPS click) overrides persisted state and keeps it open
        setShowModal(true);
        try {
          localStorage.setItem(WEATHER_MODAL_STATE_KEY, 'open');
        } catch {}
        return; // do not close the modal in this path
      }

      // Initialize modal state from localStorage to avoid repeated prompts across navigation
      const modalState = localStorage.getItem(WEATHER_MODAL_STATE_KEY);
      if (modalState === 'closed' || modalState === 'resolved') {
        setShowModal(false);
      } else if (modalState === 'open') {
        setShowModal(true);
      }

      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);
      if (!parsed?.location || parsed.current?.temperature === undefined) return;

      setLatitude(parsed.location.latitude);
      setLongitude(parsed.location.longitude);
      setLocationAddress(parsed.location.address || '');
      setCurrentTemperature(parsed.current.temperature);
      setCurrentHumidity(parsed.current.humidity);
      setCurrentRainfall(parsed.current.rainfall);
      setCurrentTimestamp(parsed.current.timestamp || '');
      setForecast(parsed.forecast || []);
      setDisplayTime(parsed.displayTime || new Date().toLocaleString());
      setWeatherFetched(true);
      setShowModal(false);

      // Persist resolved state so modal doesn't reappear unnecessarily
      try {
        localStorage.setItem(WEATHER_MODAL_STATE_KEY, 'resolved');
      } catch {}

      if (onWeatherDataFetched) {
        onWeatherDataFetched(parsed as WeatherData);
      }

      console.log('[CACHE] Hydrated weather from cache');
    } catch (err) {
      console.warn('[CACHE] Failed to hydrate cache', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // FETCH WEATHER DATA
  // ============================================================================
  const fetchWeatherData = async (lat: number, lon: number): Promise<void> => {
    console.log('[fetchWeatherData] START with coords:', { lat, lon });
    setLoading(true);
    setError('');

    try {
      // Fetch current weather from OpenWeatherMap (accurate real-time data)
      const currentWeather = await fetchOpenWeatherData(lat, lon);
      
      if (!currentWeather) {
        throw new Error('Failed to fetch current weather data');
      }

      console.log('[fetchWeatherData] Current weather fetched:', currentWeather);
      setCurrentTemperature(currentWeather.temperature);
      setCurrentHumidity(currentWeather.humidity);
      setCurrentRainfall(currentWeather.rainfall);
      setDisplayTime(new Date().toLocaleString());
      setCurrentTimestamp(new Date().toISOString());

      // Fetch forecast data
      const forecastData = await fetchWeatherForecastData(lat, lon);
      
      if (forecastData) {
        setForecast(forecastData);
      }

      // Get readable address
      const address = await reverseGeocode(lat, lon);
      setLocationAddress(address);

      // Pass data to parent
      const weatherData: WeatherData = {
        current: {
          temperature: currentWeather.temperature,
          humidity: currentWeather.humidity,
          rainfall: currentWeather.rainfall,
          timestamp: new Date().toISOString(),
        },
        forecast: forecastData || [],
        location: {
          latitude: lat,
          longitude: lon,
          address: address,
        },
      };

      if (onWeatherDataFetched) {
        console.log('[fetchWeatherData] About to call onWeatherDataFetched with:', weatherData);
        onWeatherDataFetched(weatherData);
      }

      // Cache data for reuse across navigation
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
            ...weatherData,
            displayTime: new Date().toLocaleString(),
          }));
        }
      } catch (err) {
        console.warn('[CACHE] Failed to write cache', err);
      }
      setWeatherFetched(true);
      setShowModal(false);
      setLoading(false);

      // Mark modal as resolved (accepted or manually provided)
      try {
        localStorage.setItem(WEATHER_MODAL_STATE_KEY, 'resolved');
      } catch {}

      console.log('Weather data fetched successfully from OpenWeatherMap:', weatherData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Weather fetch error:', err);
      setLoading(false);
    }
  };

  // ============================================================================
  // REFRESH WEATHER DATA
  // ============================================================================

  const refreshWeatherData = async (): Promise<void> => {
    if (latitude && longitude) {
      await fetchWeatherData(latitude, longitude);
    }
  };

  // ============================================================================
  // RESET LOCATION - Clear weather and prompt for new area
  // ============================================================================

  const resetLocation = (): void => {
    console.log('[RESET] ========== RESET LOCATION CLICKED ==========');
    console.log('[RESET] Before - showModal:', showModal, 'weatherFetched:', weatherFetched, 'temp:', currentTemperature);
    
    // Set all state to clear weather display
    setLoading(false);
    setError('');
    setWeatherFetched(false);
    setCurrentTemperature(undefined);
    setCurrentHumidity(undefined);
    setCurrentRainfall(undefined);
    setCurrentTimestamp('');
    setDisplayTime(new Date().toLocaleString());
    setForecast([]);
    setLatitude(undefined);
    setLongitude(undefined);
    setLocationAddress('');
    setManualLocation('');
    
    // CRITICAL: Must set showModal to true LAST to trigger modal render
    setShowModal(true);

    // Persist open state so it remains open across navigation until closed
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(WEATHER_MODAL_STATE_KEY, 'open');
      }
    } catch {}

    // Clear persisted cache
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(WEATHER_CACHE_KEY);
      }
    } catch (err) {
      console.warn('[CACHE] Failed to clear cache', err);
    }
    
    console.log('[RESET] ========== STATE UPDATES QUEUED, AWAITING RENDER ==========');
  };

  // ============================================================================
  // REQUEST GEOLOCATION
  // ============================================================================

  const requestGeolocation = (): void => {
    console.log('[requestGeolocation] START - requesting user location');
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter location manually.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log('[requestGeolocation] SUCCESS - location received:', { lat, lon });
        
        setLatitude(lat);
        setLongitude(lon);

        console.log('[requestGeolocation] Calling fetchWeatherData with:', { lat, lon });
        await fetchWeatherData(lat, lon);
      },
      (err) => {
        console.error('[requestGeolocation] ERROR:', err);

        let errorMsg = 'Unable to access your location. ';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg += 'Please enable location access or enter manually below.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += 'An unknown error occurred.';
        }

        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ============================================================================
  // MANUAL LOCATION SUBMISSION
  // ============================================================================

  const handleManualLocationSubmit = async (location: string): Promise<void> => {
    if (!location.trim()) {
      setError('Please enter a pincode or district name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const coords = await geocodeLocation(location);
      
      setLatitude(coords.lat);
      setLongitude(coords.lon);

      console.log('Manual location converted to coordinates:', coords);

      await fetchWeatherData(coords.lat, coords.lon);
      
      setManualLocation('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process location';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // If modal should be shown, display it (for location access/manual entry)
  if (showModal) {
    return (
      <LocationModal
        isOpen={true}
        onAllow={requestGeolocation}
        onCancel={() => {
          setShowModal(false);
          try {
            localStorage.setItem(WEATHER_MODAL_STATE_KEY, 'closed');
          } catch {}
        }}
        onManualInput={handleManualLocationSubmit}
        isLoading={loading}
        manualLocation={manualLocation}
        setManualLocation={setManualLocation}
        error={error}
      />
    );
  }

  // If weather has been fetched successfully, show weather details
  if (weatherFetched && currentTemperature !== undefined && showDetailedView) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Weather Conditions</CardTitle>
                <CardDescription>
                  {locationAddress || 'Detected Location'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    console.log('[BUTTON] Reset Location clicked!');
                    resetLocation();
                  }}
                  size="default"
                  className="bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm"
                  title="Reset location and choose again"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset Location
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Temperature */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Thermometer className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-2xl font-bold">{currentTemperature?.toFixed(1)}°C</p>
                </div>
              </div>

              {/* Humidity */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Droplets className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="text-2xl font-bold">{currentHumidity?.toFixed(0)}%</p>
                </div>
              </div>

              {/* Rainfall */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CloudRain className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Rainfall</p>
                  <p className="text-2xl font-bold">{currentRainfall?.toFixed(1)} mm</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: {displayTime}
            </p>
          </CardContent>
        </Card>

        {/* 14-Day Forecast */}
        {forecast.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>14-Day Weather Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {forecast.map((day, index) => (
                  <div
                    key={`forecast-day-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-red-600 font-medium">
                        ↑ {day.temperatureMax.toFixed(0)}°C
                      </span>
                      <span className="text-blue-600 font-medium">
                        ↓ {day.temperatureMin.toFixed(0)}°C
                      </span>
                      <span className="text-green-600 font-medium">
                        <CloudRain className="inline h-4 w-4 mr-1" />
                        {day.precipitationSum.toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // No weather data available and modal not shown, return empty
  return null;
};

export default AutoWeatherFetcher;