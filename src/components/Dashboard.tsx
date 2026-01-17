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
  
  // Use state for auth status so it can be updated
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  
  const [dashboardData, setDashboardData] = useState<any>({
    totalPredictions: 0,
    avgYield: 0,
    successRate: 0,
    activeFarmers: 0
  });
  
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard stats on mount and periodically
  useEffect(() => {
    const fetchStats = async () => {
      // Re-check login status each time to catch login/logout changes
      const currentToken = localStorage.getItem('authToken');
      const isCurrentlyLoggedIn = !!currentToken;
      
      // Update login state if it changed
      if (isCurrentlyLoggedIn !== isLoggedIn) {
        console.log('Auth state changed:', isCurrentlyLoggedIn ? 'logged in' : 'logged out');
      }
      setIsLoggedIn(isCurrentlyLoggedIn);
      
      try {
        const stats = await predictionAPI.getDashboardStats();
        
        if (stats.type === 'personal' && isCurrentlyLoggedIn) {
          // User is logged in - show personal dashboard
          setPersonalData(stats);
          setDashboardData({
            totalPredictions: 0,
            avgYield: 0,
            successRate: 0,
            activeFarmers: 0
          });
        } else {
          // Public dashboard - show aggregate stats
          setDashboardData({
            totalPredictions: stats.total_predictions || 0,
            avgYield: stats.avg_yield || 0,
            successRate: stats.success_rate || 0,
            activeFarmers: stats.active_farmers || 0
          });
          setPersonalData(null);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        // Set default data instead of showing error
        setDashboardData({
          totalPredictions: 0,
          avgYield: 0,
          successRate: 0,
          activeFarmers: 1
        });
        setPersonalData(null);
        setError(''); // Clear error to show dashboard with default data
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();
    
    // Set up polling every 3 seconds to check for new predictions
    const interval = setInterval(fetchStats, 3000);
    
    // Also refresh when window regains focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when storage changes (logout from another tab)
    const handleStorageChange = () => {
      fetchStats();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth change events
    const handleAuthChange = () => {
      console.log('Auth change event received');
      fetchStats();
    };
    window.addEventListener('auth-changed', handleAuthChange);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
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

  // Recent predictions (mock data with actual dates)
  const now = new Date();
  const recentPredictions = [
    { crop: 'Rice', yield: 4500, risk: 'Low', date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Wheat', yield: 3200, risk: 'Medium', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Corn', yield: 5500, risk: 'Low', date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Cotton', yield: 2800, risk: 'High', date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Show personal dashboard if logged in and data available
  if (isLoggedIn && personalData) {
    return <PersonalDashboard data={personalData} loading={loading} />;
  }

  // Show public dashboard if not logged in
  return <PublicDashboard data={dashboardData} loading={loading} isLoggedIn={isLoggedIn} />;
}

// Personal Dashboard Component (for logged-in users)
function PersonalDashboard({ data, loading }: { data: any; loading: boolean }) {
  const { t } = useI18n();
  
  const user = data.user || {};
  const yearSummary = data.year_summary || {};
  const stats = data.statistics || {};
  const riskDist = data.risk_distribution || {};
  const cropRec = data.crop_recommendations || {};
  const recentPreds = data.recent_predictions || [];
  
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Personalized Welcome - CLEARLY PERSONAL */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-lg shadow-lg border-4 border-green-400">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">👤 {user.name}'s Personal Dashboard</h1>
            <p className="text-xl opacity-90">Your individual farming analytics & predictions for {yearSummary.year}</p>
            <p className="text-sm opacity-75 mt-2">📧 {user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">📅</p>
            <p className="text-sm">{currentDate}</p>
          </div>
        </div>
        <div className="bg-green-700 bg-opacity-40 rounded p-3 mt-4">
          <p className="text-sm font-semibold">✅ You are logged in - showing YOUR personalized data</p>
        </div>
      </div>

      {/* Personal Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <div className="text-sm text-gray-600">Your Predictions (2026)</div>
              <div className="text-3xl font-bold text-blue-700">
                {loading ? '...' : yearSummary.total_predictions}
              </div>
              <div className="text-xs text-gray-500">All-time: {stats.total_predictions_all_time}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200 hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌾</div>
            <div>
              <div className="text-sm text-gray-600">Avg Yield</div>
              <div className="text-3xl font-bold text-green-700">
                {loading ? '...' : stats.avg_yield}
              </div>
              <div className="text-xs text-gray-500">kg/hectare</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-yellow-200 hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-3xl font-bold text-yellow-700">
                {loading ? '...' : `${stats.success_rate}%`}
              </div>
              <div className="text-xs text-gray-500">High confidence predictions</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200 hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌱</div>
            <div>
              <div className="text-sm text-gray-600">Top Crop</div>
              <div className="text-3xl font-bold text-purple-700">
                {loading ? '...' : stats.top_crop}
              </div>
              <div className="text-xs text-gray-500">Most recommended</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2026 Prediction Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Your 2026 Prediction Summary</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Yield Predictions</div>
            <div className="text-2xl font-bold text-blue-600">{yearSummary.yield_predictions}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Crop Recommendations</div>
            <div className="text-2xl font-bold text-green-600">{yearSummary.crop_predictions}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Risk Assessments</div>
            <div className="text-2xl font-bold text-yellow-600">{yearSummary.risk_predictions}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-purple-600">{yearSummary.total_predictions}</div>
          </div>
        </div>
      </div>

      {/* Crop Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🌽 Your Crop Recommendations</h3>
        {Object.keys(cropRec).length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(cropRec).map(([crop, count]: [string, any]) => (
              <div key={crop} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800">{crop}</div>
                <div className="text-2xl font-bold text-green-600 mt-2">{count}</div>
                <div className="text-sm text-gray-600">recommendations</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No crop predictions yet. Make your first prediction!</div>
        )}
      </div>

      {/* Risk Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Risk Assessment Summary</h3>
        {Object.keys(riskDist).length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(riskDist).map(([risk, count]: [string, any]) => {
              const colors = {
                'Low': 'bg-green-50 border-green-200 text-green-700',
                'Medium': 'bg-yellow-50 border-yellow-200 text-yellow-700',
                'High': 'bg-red-50 border-red-200 text-red-700'
              };
              const colorClass = colors[risk as keyof typeof colors] || 'bg-gray-50';
              return (
                <div key={risk} className={`${colorClass} border p-4 rounded-lg`}>
                  <div className="font-semibold">{risk} Risk</div>
                  <div className="text-2xl font-bold mt-2">{count}</div>
                  <div className="text-sm opacity-75">assessments</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No risk predictions yet.</div>
        )}
      </div>
    </div>
  );
}

// Public Dashboard Component (for non-logged-in users)
function PublicDashboard({ data, loading, isLoggedIn }: { data: any; loading: boolean; isLoggedIn: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
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

  // Recent predictions (mock data with actual dates)
  const now = new Date();
  const recentPredictions = [
    { crop: 'Rice', yield: 4500, risk: 'Low', date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Wheat', yield: 3200, risk: 'Medium', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Corn', yield: 5500, risk: 'Low', date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { crop: 'Cotton', yield: 2800, risk: 'High', date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  ];

  const getRiskBadge = (risk: string) => {
    const colors = {
      Low: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-red-100 text-red-700'
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-lg shadow-lg border-4 border-blue-400">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">🌍 Community Dashboard</h1>
            <p className="text-xl opacity-90">Aggregate statistics from all farmers using AgroAI Platform</p>
            <div className="bg-blue-700 bg-opacity-40 rounded p-3 mt-4">
              <p className="text-sm font-semibold">ℹ️ This is PUBLIC community data - NOT personalized</p>
              <p className="text-sm mt-1">👤 To see YOUR personal dashboard and save predictions, <span className="font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>LOGIN</span> or <span className="font-bold cursor-pointer hover:underline" onClick={() => navigate('/register')}>REGISTER</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">📅</p>
            <p className="text-sm">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <div className="text-sm text-gray-600">{t('totalPredictions')}</div>
              <div className="text-3xl font-bold text-gray-800">
                {loading ? '...' : data.totalPredictions}
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
                {loading ? '...' : data.avgYield}
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
                {loading ? '...' : `${data.successRate}%`}
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
                {loading ? '...' : data.activeFarmers.toLocaleString()}
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border-2" style={{ backgroundColor: '#E0F7FF', borderColor: '#7FE5E0' }}>
          <div className="text-3xl mb-3" aria-hidden="true"></div>
          <h4 className="font-semibold text-gray-800 mb-2">{t('predictYield')}</h4>
          <p className="text-sm text-gray-600 mb-4">
            {t('yieldPredictionDesc')}
          </p>
          <button
            className="w-full text-white py-2 rounded-md transition-colors text-sm font-medium"
            style={{ backgroundColor: '#00B8D9' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0099B8')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#00B8D9')}
            onClick={() => navigate('/yield')}
          >
            {t('startPrediction')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
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
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-lg shadow-lg">
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