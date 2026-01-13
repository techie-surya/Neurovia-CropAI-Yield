import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { predictCropYield, recommendCrops, predictWeatherRisk, calculateFeatureImportance } from '../utils/mockMLModels';
import { WeatherWidget } from './WeatherWidget';
import { useI18n } from '../context/LanguageContext';
import { predictionAPI } from '../utils/api';

export function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    totalPredictions: 0,
    avgYield: 0,
    successRate: 0,
    activeFarmers: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Always fetch stats - backend returns public data if not logged in
        const stats = await predictionAPI.getDashboardStats();
        setDashboardData({
          totalPredictions: stats.total_predictions || 0,
          avgYield: stats.avg_yield || 0,
          successRate: stats.success_rate || 0,
          activeFarmers: stats.active_farmers || 0
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        // On error, still show active farmers count if available
        setDashboardData({
          totalPredictions: 0,
          avgYield: 0,
          successRate: 0,
          activeFarmers: 0
        });
        setError('Could not load dashboard data');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Sample yield trend data
  const yieldTrendData = [
    { month: 'Jan', yield: 3800 },
    { month: 'Feb', yield: 4100 },
    { month: 'Mar', yield: 4500 },
    { month: 'Apr', yield: 4200 },
    { month: 'May', yield: 4600 },
    { month: 'Jun', yield: 4350 }
  ];

  // Crop distribution
  const cropDistributionData = [
    { name: 'Rice', value: 35, color: '#10b981' },
    { name: 'Wheat', value: 25, color: '#f59e0b' },
    { name: 'Corn', value: 20, color: '#3b82f6' },
    { name: 'Others', value: 20, color: '#6b7280' }
  ];

  // Risk levels
  const riskData = [
    { level: 'Low Risk', count: 28, color: '#10b981' },
    { level: 'Medium Risk', count: 15, color: '#f59e0b' },
    { level: 'High Risk', count: 4, color: '#ef4444' }
  ];

  // Recent predictions (mock data)
  const recentPredictions = [
    { crop: 'Rice', yield: 4500, risk: 'Low', date: 'Jan 8, 2026' },
    { crop: 'Wheat', yield: 3200, risk: 'Medium', date: 'Jan 7, 2026' },
    { crop: 'Corn', yield: 5500, risk: 'Low', date: 'Jan 6, 2026' },
    { crop: 'Cotton', yield: 2800, risk: 'High', date: 'Jan 5, 2026' }
  ];

  const getRiskBadge = (risk: string) => {
    const colors = {
      Low: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-red-100 text-red-700'
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const token = localStorage.getItem('authToken');

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🌾 {t('welcomeDashboard')}</h1>
        <p className="text-lg opacity-90">{t('dashboardSubtitle')}</p>
        {token ? (
          <p className="text-sm opacity-75 mt-2">📊 Your personalized dashboard - all predictions saved to database</p>
        ) : (
          <p className="text-sm opacity-75 mt-2">Login to see your personalized dashboard and predictions</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <div className="text-sm text-gray-600">{t('totalPredictions')}</div>
              <div className="text-3xl font-bold text-gray-800">
                {loading ? '...' : dashboardData.totalPredictions}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌾</div>
            <div>
              <div className="text-sm text-gray-600">{t('avgYield')}</div>
              <div className="text-3xl font-bold text-green-700">
                {loading ? '...' : dashboardData.avgYield}
              </div>
              <div className="text-xs text-gray-500">kg/hectare</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <div className="text-sm text-gray-600">{t('successRate')}</div>
              <div className="text-3xl font-bold text-blue-700">
                {loading ? '...' : `${dashboardData.successRate}%`}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">👨‍🌾</div>
            <div>
              <div className="text-sm text-gray-600">{t('activeFarmers')}</div>
              <div className="text-3xl font-bold text-purple-700">
                {loading ? '...' : dashboardData.activeFarmers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Yield Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">📈 Yield Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={yieldTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={3} name="Avg Yield (kg/ha)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">🥧 Crop Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cropDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {cropDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">⚠️ Risk Level Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="Number of Predictions">
              {riskData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">📋 {t('recentPredictions')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('crop')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('predictedYield')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('riskLevel')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {recentPredictions.map((pred, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-800">{pred.crop}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-700 font-semibold">{pred.yield.toLocaleString()} kg/ha</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadge(pred.risk)}`}>
                      {pred.risk} {t('riskBadge')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 text-sm">{pred.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
          <div className="text-3xl mb-3">🔮</div>
          <h4 className="font-semibold text-gray-800 mb-2">{t('predictYield')}</h4>
          <p className="text-sm text-gray-600 mb-4">
            {t('yieldPredictionDesc')}
          </p>
          <button
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            onClick={() => navigate('/yield')}
          >
            {t('startPrediction')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="text-3xl mb-3">🌱</div>
          <h4 className="font-semibold text-gray-800 mb-2">{t('cropRecommendationTitle')}</h4>
          <p className="text-sm text-gray-600 mb-4">
            {t('recommendationsDesc')}
          </p>
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={() => navigate('/recommendation')}
          >
            {t('getRecommendations')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
          <div className="text-3xl mb-3">🎯</div>
          <h4 className="font-semibold text-gray-800 mb-2">{t('simulator')}</h4>
          <p className="text-sm text-gray-600 mb-4">
            Test different scenarios and optimize your farming decisions
          </p>
          <button
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
            onClick={() => navigate('/simulator')}
          >
            Run Simulation
          </button>
        </div>
      </div>

      {/* Platform Benefits */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">🚀 Platform Benefits</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-semibold mb-1">Increase Yield</h4>
            <p className="text-sm opacity-90">Up to 25% improvement with AI optimization</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold mb-1">Reduce Costs</h4>
            <p className="text-sm opacity-90">Optimize fertilizer and water usage</p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚠️</div>
            <h4 className="font-semibold mb-1">Minimize Risk</h4>
            <p className="text-sm opacity-90">Predict weather and climate risks early</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold mb-1">Better Decisions</h4>
            <p className="text-sm opacity-90">Data-driven insights before cultivation</p>
          </div>
        </div>
      </div>

      {/* Weather Widget */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">🌤️ {t('weatherForecast')}</h3>
        <WeatherWidget />
      </div>
    </div>
  );
}