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
import AutoWeatherFetcher, { WeatherData as AutoWeatherData } from './AutoWeatherFetcher';

interface WeatherWidgetProps {
  city?: string;
  showForecast?: boolean;
}

export function WeatherWidget({ city, showForecast = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [locationInput, setLocationInput] = useState(city || '');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [useAutoWeather, setUseAutoWeather] = useState(!city); // Use auto-weather if no city provided
  const [autoKey, setAutoKey] = useState(0); // Remount key for AutoWeatherFetcher
  const [showAutoModal, setShowAutoModal] = useState(false); // Only show modal when GPS is clicked

  // Handle auto-fetched weather data
  const handleAutoWeatherData = (data: AutoWeatherData) => {
    // Convert AutoWeatherData to WeatherData format
    const weatherData: WeatherData = {
      location: data.location.address || `${data.location.latitude}, ${data.location.longitude}`,
      country: 'IN',
      temperature: data.current.temperature,
      feelsLike: data.current.temperature,
      humidity: data.current.humidity,
      pressure: 1013,
      windSpeed: 5,
      precipitation: data.current.rainfall,
      description: 'Partly cloudy',
      icon: '02d',
      sunrise: Math.floor(Date.now() / 1000) - 7200,
      sunset: Math.floor(Date.now() / 1000) + 7200,
      cloudiness: 40,
    };
    
    setWeather(weatherData);
    setIsLoading(false);
    setLastUpdated(new Date());
    
    // Close the modal after successful fetch
    setShowAutoModal(false);

    if (showForecast && data.forecast && data.forecast.length > 0) {
      const forecastData: WeatherForecast[] = data.forecast.map(day => ({
        date: day.date,
        tempMax: day.temperatureMax,
        tempMin: day.temperatureMin,
        description: 'Partly cloudy',
        icon: '02d',
        humidity: 65,
      }));
      setForecast(forecastData);
    }
  };

  useEffect(() => {
    // If city is provided, fetch that city's weather
    if (city) {
      setUseAutoWeather(false);
      fetchWeatherData(city);
    }
  }, [city]);

  const fetchWeatherData = async (location: string) => {
    setIsLoading(true);
    
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
      setWeather(getMockWeatherData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      fetchWeatherData(locationInput.trim());
      setUseAutoWeather(false);
    }
  };

  const handleCurrentLocation = () => {
    // Switch to auto-weather mode and show the modal for location permission
    try {
      localStorage.removeItem('autoWeatherCache');
    } catch (_) {
      /* ignore */
    }
    setWeather(null);
    setForecast([]);
    setUseAutoWeather(true);
    setShowAutoModal(true); // Show modal when GPS is clicked
    setAutoKey((k) => k + 1);
    setIsLoading(true);
  };

  const getWeatherBackground = (description: string) => {
    const lower = description?.toLowerCase() || '';
    if (lower.includes('clear')) return 'from-yellow-400 to-orange-400';
    if (lower.includes('cloud')) return 'from-gray-400 to-gray-600';
    if (lower.includes('rain')) return 'from-blue-500 to-blue-700';
    if (lower.includes('thunder')) return 'from-purple-600 to-indigo-800';
    return 'from-green-500 to-teal-600';
  };

  // Always render the main UI; embed auto-weather fetcher when needed
  const shouldShowContent = !!weather && weather.temperature !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Auto-weather fetcher (renders modal only when GPS is clicked) */}
      {useAutoWeather && showAutoModal && (
        <AutoWeatherFetcher 
          key={autoKey}
          onWeatherDataFetched={handleAutoWeatherData}
          showDetailedView={false}
          autoShowModal={true}
        />
      )}

      {/* Search bar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <form onSubmit={handleLocationSearch} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city or village..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            title="Use current location"
          >
            📍
          </button>
        </form>
      </div>

      {/* Loading or empty state */}
      {!shouldShowContent && (
        <div className="p-8 flex flex-col items-center justify-center text-gray-500 gap-3">
          <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm">Fetching weather for your location...</p>
        </div>
      )}

      {shouldShowContent && weather && (
        <>
          {/* Main weather hero */}
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(to right, #10b981, #22c55e)',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff' }}>
                    {weather.location || 'Location'}{weather.country ? `, ${weather.country}` : ''}
                  </h3>
                </div>
                <p style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9 }}>
                  {lastUpdated.toLocaleString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div style={{ fontSize: '64px' }}>
                {weather.description ? getWeatherEmoji(weather.description) : '🌤️'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '16px' }}>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1' }}>
                {weather.temperature ? Math.round(weather.temperature) : '--'}°C
              </div>
              <div>
                <div style={{ fontSize: '18px', textTransform: 'capitalize', color: '#ffffff', marginBottom: '4px' }}>
                  {weather.description || 'Clear'}
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9 }}>
                  Feels like {weather.feelsLike ? Math.round(weather.feelsLike) : '--'}°C
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
            <MetricCard label="Humidity" value={`${weather.humidity}%`} tone="blue" />
            <MetricCard label="Precipitation" value={`${weather.precipitation}mm`} tone="purple" />
            <MetricCard label="Pressure" value={`${weather.pressure}hPa`} tone="orange" />
            <MetricCard label="Wind" value={`${weather.windSpeed}km/h`} tone="green" />
          </div>

          {/* Sunrise / Sunset */}
          <div className="px-6 pt-2 pb-4">
            <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-gradient-to-r from-amber-50 to-purple-50 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <div className="text-sm text-gray-600">Sunrise</div>
                  <div className="font-semibold text-amber-700">{formatTime(weather.sunrise)}</div>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌇</span>
                <div>
                  <div className="text-sm text-gray-600">Sunset</div>
                  <div className="font-semibold text-purple-700">{formatTime(weather.sunset)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Farming advice */}
          <div className="px-6 pt-2 pb-6">
            <div className="rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌾</span>
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Farming Advice</h4>
                  <p className="text-sm text-green-800 leading-relaxed">{getFarmingAdvice(weather)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          {showForecast && forecast.length > 0 && (
            <div className="px-6 pt-2 pb-6">
              <h4 className="font-semibold text-gray-800 mb-4">5-Day Forecast</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {forecast.map((day, index) => (
                  <div
                    key={`fc-${index}`}
                    className="bg-white border border-gray-200 rounded-lg p-5 text-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Increased padding from p-3 (12px) to p-5 (20px) to prevent content from touching border */}
                    <div className="text-xs text-gray-600 mb-2">
                      {typeof day.date === 'string' ? day.date : day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-2xl my-3">{getWeatherEmoji(day.description)}</div>
                    <div className="font-semibold text-gray-800 mb-1">{day.tempMax}° / {day.tempMin}°</div>
                    <div className="text-xs text-gray-500 mt-2 capitalize">{day.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API warning */}
          {!isWeatherAPIConfigured() && (
            <div className="px-6 pb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
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
          )}
        </>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  tone: 'blue' | 'purple' | 'orange' | 'green';
}

function MetricCard({ label, value, tone }: MetricCardProps) {
  const toneMap: Record<MetricCardProps['tone'], string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div className={`text-center p-4 rounded-lg border ${toneMap[tone]} shadow-sm`}>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
