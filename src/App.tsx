import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { YieldPrediction } from './components/YieldPrediction';
import { CropRecommendation } from './components/CropRecommendation';
import { FertilizerOptimization } from './components/FertilizerOptimization';
import { RiskPrediction } from './components/RiskPrediction';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ExplainableAI } from './components/ExplainableAI';
import { Weather } from './components/Weather';
import { useI18n } from './context/LanguageContext';
import { AuthModal, AuthMode } from './components/AuthModal';

function App() {
  const { t } = useI18n();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const navigate = useNavigate();

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
  };

  const navLinks = [
    { path: '/dashboard', label: t('dashboard') },
    { path: '/weather', label: t('weather') },
    { path: '/yield', label: t('yieldPrediction') },
    { path: '/recommendation', label: t('recommendation') },
    { path: '/optimization', label: t('optimization') },
    { path: '/risk', label: t('risk') },
    { path: '/simulator', label: t('simulator') },
    { path: '/explainable', label: t('explainable') }
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
                <p className="text-xs text-gray-600">{t('headerSubtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth('login')}
                type="button"
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm cursor-pointer"
              >
                {t('login')}
              </button>
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
          <Route path="/yield" element={<YieldPrediction />} />
          <Route path="/recommendation" element={<CropRecommendation />} />
          <Route path="/optimization" element={<FertilizerOptimization />} />
          <Route path="/risk" element={<RiskPrediction />} />
          <Route path="/simulator" element={<WhatIfSimulator />} />
          <Route path="/explainable" element={<ExplainableAI />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">About AgroAI Platform</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered platform helping farmers predict crop yields, optimize resources, 
                and make data-driven decisions before cultivation.
              </p>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Yield Prediction with ML</li>
                <li>✓ Smart Crop Recommendation</li>
                <li>✓ Resource Optimization</li>
                <li>✓ Risk Assessment</li>
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Technology Stack</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>🧠 Random Forest & XGBoost</li>
                <li>⚛️ React + TypeScript</li>
                <li>📊 Recharts Visualization</li>
                <li>🎨 Tailwind CSS</li>
              </ul>
            </div>

            {/* Target Users */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Target Users</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>👨‍🌾 Farmers</li>
                <li>🏛️ Agriculture Officers</li>
                <li>📋 Policymakers</li>
                <li>🌾 Agri-businesses</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                © 2026 AgroAI Platform - National AI Hackathon Project
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  🏆 Hackathon Ready
                </span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  🚀 Demo Complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Helper - Floating Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg shadow-2xl max-w-xs">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold mb-1 text-sm">Quick Demo Guide</h4>
              <p className="text-xs opacity-90">
                1. Start with Dashboard overview<br />
                2. Try Yield Prediction<br />
                3. Test What-If Simulator (★ killer feature)<br />
                4. Show Explainable AI for trust
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        open={!!authMode}
        mode={authMode}
        onClose={closeAuth}
        onModeChange={openAuth}
        onLoginSuccess={() => navigate('/')}
      />
    </div>
  );
}

export default App;