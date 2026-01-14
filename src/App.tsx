import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthModal, AuthMode } from './components/AuthModal';
import { CropRecommendation } from './components/CropRecommendation';
import { Dashboard } from './components/Dashboard';
import EnhancedPredictionForm from './components/EnhancedPredictionForm';
import { ExplainableAI } from './components/ExplainableAI';
import { FertilizerOptimization } from './components/FertilizerOptimization';
import HistoricalRecords from './components/HistoricalRecords';
import Profile from './components/Profile';
import { RiskPrediction } from './components/RiskPrediction';
import { Weather } from './components/Weather';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { YieldPrediction } from './components/YieldPrediction';
import { useI18n } from './context/LanguageContext';
import { authAPI } from './utils/api';

function App() {
  const { t } = useI18n();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      // Try to get user name
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || user.email);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
  };

  const handleLoginSuccess = () => {
    // Close modal first
    setAuthMode(null);
    
    // Get fresh data from localStorage
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    
    console.log('Login success - Token:', !!token, 'User:', userStr?.substring(0, 50));
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Setting user:', user.name || user.email);
        setUserName(user.name || user.email);
        setIsLoggedIn(true);
        
        // Dispatch custom event to notify Dashboard
        window.dispatchEvent(new Event('auth-changed'));
        
        // Wait a moment then navigate to yield page
        setTimeout(() => {
          navigate('/yield');
        }, 100);
      } catch (e) {
        console.error('Parse error:', e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setIsLoggedIn(false);
      setUserName('');
      
      // Dispatch custom event to notify Dashboard
      window.dispatchEvent(new Event('auth-changed'));
      
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { path: '/dashboard', label: t('dashboard') },
    { path: '/weather', label: t('weather') },
    { path: '/predict', label: 'Predict' },
    { path: '/yield', label: t('yieldPrediction') },
    { path: '/recommendation', label: t('recommendation') },
    { path: '/optimization', label: t('optimization') },
    { path: '/risk', label: t('risk') },
    { path: '/simulator', label: t('simulator') },
    { path: '/explainable', label: t('explainable') },
    ...(isLoggedIn ? [
      { path: '/records', label: 'Records' },
      { path: '/profile', label: 'Profile' }
    ] : [])
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Global Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🌾</div>
              <div>
                <h1 className="text-2xl font-bold text-green-700">{t('appTitle')}</h1>
                <p className="text-xs text-gray-600">Smart Agriculture AI</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(() => {
                // Check localStorage directly to ensure real-time updates
                const token = localStorage.getItem('authToken');
                const userStr = localStorage.getItem('currentUser');
                
                if (token && userStr) {
                  try {
                    const user = JSON.parse(userStr);
                    const displayName = user.name || user.email;
                    return (
                      <>
                        <div className="text-sm text-gray-700 px-3 py-2">
                          Welcome, <span className="font-semibold">{displayName}</span>
                        </div>
                        <button
                          onClick={handleLogout}
                          type="button"
                          className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm cursor-pointer"
                        >
                          Logout
                        </button>
                      </>
                    );
                  } catch (e) {
                    // Fall through to login button if parse fails
                  }
                }
                
                // Default: show login button
                return (
                  <button
                    onClick={() => openAuth('login')}
                    type="button"
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm cursor-pointer"
                  >
                    {t('login')}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        <nav className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto py-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                      isActive ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`
                  }
                  end={link.path === '/dashboard'}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/predict" element={<EnhancedPredictionForm />} />
          <Route path="/yield" element={<YieldPrediction />} />
          <Route path="/recommendation" element={<CropRecommendation />} />
          <Route path="/optimization" element={<FertilizerOptimization />} />
          <Route path="/risk" element={<RiskPrediction />} />
          <Route path="/simulator" element={<WhatIfSimulator />} />
          <Route path="/explainable" element={<ExplainableAI />} />
          <Route path="/records" element={<HistoricalRecords />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* Demo Helper - Floating Button */}
      {showDemoGuide && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg shadow-2xl max-w-xs relative">
            <button
              onClick={() => setShowDemoGuide(false)}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors"
              aria-label="Close demo guide"
            >
              ✕
            </button>
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold mb-1 text-sm">Quick Demo Guide</h4>
                <p className="text-xs opacity-90">
                  1. Start with Dashboard overview<br />
                  2. Try Yield Prediction<br />
                  3. Test What-If Simulator<br />
                  4. Show Explainable AI for trust
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={!!authMode}
        mode={authMode}
        onClose={closeAuth}
        onModeChange={openAuth}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;