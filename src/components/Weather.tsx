import { WeatherWidget } from './WeatherWidget';

import { useI18n } from '../context/LanguageContext';

export function Weather() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🌤️ Today's Weather & Forecast</h2>
        <p className="opacity-90">Real-time weather conditions and farming recommendations</p>
      </div>

      {/* Main Weather Widget with Forecast */}
      <WeatherWidget showForecast={true} />

      {/* Weather Tips for Farming */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">🌾 Weather-Based Farming Tips</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Temperature Tips */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🌡️</span>
              <h4 className="font-semibold text-gray-800">{t('temperatureGuide')}</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>20-30°C:</strong> {t('ideal')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span><strong>30-35°C:</strong> {t('increase')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>&gt;35°C:</strong> {t('critical')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>&lt;15°C:</strong> Protect sensitive crops. Delay planting if possible.</span>
              </li>
            </ul>
          </div>

          {/* Humidity Tips */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">💧</span>
              <h4 className="font-semibold text-gray-800">Humidity Guide</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>50-70%:</strong> Optimal for most crops. Maintain regular irrigation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span><strong>&gt;80%:</strong> High disease risk. Improve ventilation, avoid evening watering.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span><strong>&lt;40%:</strong> Dry conditions. Increase watering, use mulch to retain moisture.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span><strong>Foggy mornings:</strong> Delay fungicide sprays until moisture evaporates.</span>
              </li>
            </ul>
          </div>

          {/* Rainfall Tips */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🌧️</span>
              <h4 className="font-semibold text-gray-800">Rainfall Guide</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>Light rain (&lt;5mm):</strong> Beneficial. Good time to apply fertilizers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span><strong>Moderate (5-25mm):</strong> Skip irrigation. Check drainage systems.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>Heavy (&gt;25mm):</strong> Waterlogging risk! Improve drainage immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>No rain:</strong> Implement water conservation measures. Consider drip irrigation.</span>
              </li>
            </ul>
          </div>

          {/* Wind Tips */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">💨</span>
              <h4 className="font-semibold text-gray-800">Wind Speed Guide</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span><strong>&lt;15 km/h:</strong> Ideal for spraying pesticides and fertilizers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span><strong>15-30 km/h:</strong> Moderate. Good ventilation, avoid fine sprays.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>&gt;40 km/h:</strong> Strong winds! Secure plants, delay all spray operations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span><strong>Storm warning:</strong> Harvest ready crops, protect young plants.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">⚠️ Weather Alerts & Advisories</h3>
        
        <div className="space-y-3">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">☀️</span>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Heat Wave Advisory</h4>
                <p className="text-sm text-yellow-700">
                  Temperature may exceed 35°C this week. Increase irrigation frequency by 30%. 
                  Apply mulch to conserve soil moisture. Monitor crops for wilting.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌧️</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">{t('rainfallExpected')}</h4>
                <p className="text-sm text-blue-700">
                  {t('rainfallMsg')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">{t('favorableConditions')}</h4>
                <p className="text-sm text-green-700">
                  {t('favorableMsg')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">💡 Weather Monitoring Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3">Daily Monitoring</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Check weather forecast every morning</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Record temperature, humidity, and rainfall</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Monitor wind speed before spraying</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Track sunrise/sunset for optimal work hours</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Action Planning</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Plan irrigation based on forecasted rainfall</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Schedule field operations during favorable weather</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Prepare for extreme weather events in advance</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Adjust crop management based on climate trends</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">🔧 Setup Weather API</h3>
        <div className="text-sm text-blue-800 space-y-3">
          <p>
            To get real-time weather data, you need to configure the OpenWeatherMap API:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Visit <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenWeatherMap API</a></li>
            <li>Sign up for a free account (no credit card required)</li>
            <li>Get your API key from the dashboard</li>
            <li>Open <code className="bg-blue-100 px-2 py-1 rounded">utils/weatherAPI.ts</code></li>
            <li>Replace <code className="bg-blue-100 px-2 py-1 rounded">YOUR_API_KEY_HERE</code> with your actual API key</li>
            <li>Refresh the page to see live weather data!</li>
          </ol>
          <p className="mt-3">
            <strong>Note:</strong> Currently showing demo data. API is free with 1000 calls/day limit.
          </p>
        </div>
      </div>
    </div>
  );
}
