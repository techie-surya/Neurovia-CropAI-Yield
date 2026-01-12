import { useState, useEffect } from 'react';
import { 
  getCurrentWeather, 
  getWeatherForecast,
  getMockWeatherData,
  isWeatherAPIConfigured,
  getWeatherEmoji,
  formatTime,
  getFarmingAdvice,
  type WeatherData,
  type WeatherForecast
} from '../utils/weatherAPI';

interface WeatherWidgetProps {
  city?: string;
  showForecast?: boolean;
}

export function WeatherWidget({ city = 'Mumbai', showForecast = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [locationInput, setLocationInput] = useState(city);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    fetchWeatherData(city);
  }, [city]);

  const fetchWeatherData = async (location: string) => {
    setIsLoading(true);
    
    // Check if API is configured, otherwise use mock data
    if (!isWeatherAPIConfigured()) {
      console.warn('Weather API key not configured. Using mock data for demo.');
      setWeather(getMockWeatherData());
      setIsLoading(false);
      setLastUpdated(new Date());
      return;
    }

    try {
      const weatherData = await getCurrentWeather(location);
      setWeather(weatherData);
      
      if (showForecast) {
        const forecastData = await getWeatherForecast(location);
        setForecast(forecastData);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to mock data
      setWeather(getMockWeatherData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      fetchWeatherData(locationInput.trim());
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setUseCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // You'd call getWeatherByCoordinates here
          console.log('Current location:', latitude, longitude);
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUseCurrentLocation(false);
        }
      );
    }
  };

  const getWeatherBackground = (description: string) => {
    const lower = description?.toLowerCase() || '';
    if (lower.includes('clear')) return 'from-yellow-400 to-orange-400';
    if (lower.includes('cloud')) return 'from-gray-400 to-gray-600';
    if (lower.includes('rain')) return 'from-blue-500 to-blue-700';
    if (lower.includes('thunder')) return 'from-purple-600 to-indigo-800';
    return 'from-green-500 to-teal-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-500">Unable to load weather data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Location Search */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <form onSubmit={handleLocationSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Search location..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={useCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Use current location"
          >
            📍
          </button>
        </form>
      </div>

      {/* Main Weather Display */}
      <div className={`p-6 bg-gradient-to-br ${getWeatherBackground(weather.description)} text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📍</span>
              <h3 className="text-xl font-semibold">
                {weather.location}, {weather.country}
              </h3>
            </div>
            <p className="text-sm opacity-90">
              {lastUpdated.toLocaleString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={() => fetchWeatherData(locationInput)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="Refresh weather"
          >
            🔄
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-bold mb-2">
              {weather.temperature}°C
            </div>
            <div className="text-lg opacity-90 capitalize">
              {getWeatherEmoji(weather.description)} {weather.description}
            </div>
            <div className="text-sm opacity-75 mt-1">
              Feels like {weather.feelsLike}°C
            </div>
          </div>
          <div className="text-7xl">
            {getWeatherEmoji(weather.description)}
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="p-6 bg-white">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-sm text-gray-600">Humidity</div>
            <div className="text-xl font-bold text-blue-700">{weather.humidity}%</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl mb-1">🌧️</div>
            <div className="text-sm text-gray-600">Precipitation</div>
            <div className="text-xl font-bold text-purple-700">{weather.precipitation}mm</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl mb-1">🌡️</div>
            <div className="text-sm text-gray-600">Pressure</div>
            <div className="text-xl font-bold text-orange-700">{weather.pressure}hPa</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-1">💨</div>
            <div className="text-sm text-gray-600">Wind</div>
            <div className="text-xl font-bold text-green-700">{weather.windSpeed}km/h</div>
          </div>
        </div>

        {/* Sunrise/Sunset */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌅</span>
            <div>
              <div className="text-sm text-gray-600">Sunrise</div>
              <div className="font-semibold text-orange-700">{formatTime(weather.sunrise)}</div>
            </div>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌇</span>
            <div>
              <div className="text-sm text-gray-600">Sunset</div>
              <div className="font-semibold text-purple-700">{formatTime(weather.sunset)}</div>
            </div>
          </div>
        </div>

        {/* Farming Advice */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌾</span>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Farming Advice</h4>
              <p className="text-sm text-green-800 leading-relaxed">
                {getFarmingAdvice(weather)}
              </p>
            </div>
          </div>
        </div>

        {/* API Status Warning */}
        {!isWeatherAPIConfigured() && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm text-yellow-800">
              <span>⚠️</span>
              <div>
                <strong>Demo Mode:</strong> Using mock weather data. 
                <a 
                  href="https://openweathermap.org/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline ml-1 hover:text-yellow-900"
                >
                  Get API key
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5-Day Forecast (if enabled) */}
      {showForecast && forecast.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">5-Day Forecast</h4>
          <div className="grid grid-cols-5 gap-3">
            {forecast.map((day, index) => (
              <div 
                key={index}
                className="bg-white p-3 rounded-lg border border-gray-200 text-center hover:border-green-300 transition-colors"
              >
                <div className="text-xs text-gray-600 mb-1">{day.date}</div>
                <div className="text-3xl my-2">{getWeatherEmoji(day.description)}</div>
                <div className="font-semibold text-gray-800">
                  {day.tempMax}° / {day.tempMin}°
                </div>
                <div className="text-xs text-gray-500 mt-1 capitalize">
                  {day.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
