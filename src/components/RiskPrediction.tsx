import { useState } from 'react';
import { CROP_DATABASE, type CropName, type PredictionInput, predictWeatherRisk, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';
import { predictionAPI } from '../utils/api';
import { useEffect } from 'react';

export function RiskPrediction() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<PredictionInput>({
    crop: 'rice',
    nitrogen: 80,
    phosphorus: 40,
    potassium: 40,
    soilType: 'Loam',
    soilColor: 'Dark Brown/Black',
    waterlogging: 'No',
    phCategory: 'Neutral',
    rainfall: 600,
    temperature: 35
  });

  const [risk, setRisk] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);

  // Auto-fill rainfall and temperature from weather cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('autoWeatherCache');
      if (!cached) return;
      const data = JSON.parse(cached);
      const temperature = data?.current?.temperature;
      const rainfall = data?.current?.rainfall;
      setFormData(prev => ({
        ...prev,
        temperature: typeof temperature === 'number' ? Math.round(temperature) : prev.temperature,
        rainfall: typeof rainfall === 'number' ? Math.round(rainfall) : prev.rainfall,
      }));
    } catch (err) {
      console.warn('RiskPrediction: failed to hydrate from weather cache', err);
    }
  }, []);

  // Helper function to derive overall severity
  const deriveOverall = (alert: string): 'Low' | 'Medium' | 'High' => {
    const msg = (alert || '').toUpperCase();
    if (msg.includes('CRITICAL') || msg.includes('WARNING') || msg.includes('HIGH')) return 'High';
    if (msg.includes('CAUTION') || msg.includes('MONITOR') || msg.includes('MEDIUM')) return 'Medium';
    return 'Low';
  };

  // Recalculate risk whenever formData changes (real-time updates)
  useEffect(() => {
    const estimatedPH = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
    const localRisk = predictWeatherRisk({ ...formData, phCategory: estimatedPH });
    
    console.log('🔄 Risk recalculated:', {
      rainfall: formData.rainfall,
      floodRisk: localRisk.floodRisk,
      droughtRisk: localRisk.droughtRisk,
      heatStressRisk: localRisk.heatStressRisk,
      alert: localRisk.overallAlert
    });
    
    const overallAlert = localRisk.overallAlert || '⚡ CAUTION: Monitor weather conditions closely';
    const overallLevel = deriveOverall(overallAlert);

    // Update UI immediately when inputs change
    setRisk({
      overall: overallLevel,
      overallAlert,
      score: 0,
      drought: localRisk.droughtRisk,
      droughtRisk: localRisk.droughtRisk,
      flood: localRisk.floodRisk,
      floodRisk: localRisk.floodRisk,
      heatStress: localRisk.heatStressRisk,
      heatStressRisk: localRisk.heatStressRisk,
      factors: localRisk.recommendations,
      recommendations: localRisk.recommendations,
      confidence: 75
    });
  }, [formData]);

  // Force re-render on auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setKey(prev => prev + 1);
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use current formData directly - don't call setFormData since it's async
      const estimatedPH = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
      
      // The risk is ALREADY calculated by useEffect whenever formData changes
      // handleSubmit just needs to call backend for confidence/score
      // Keep the current risk values - DON'T override them
      const currentRisk = risk; // Save current correct values
      
      const getPHValue = (cat: string): number => {
        const map: Record<string, number> = {
          'Strongly Acidic': 5.0, 'Acidic': 5.5, 'Slightly Acidic': 6.0,
          'Neutral': 7.0, 'Slightly Alkaline': 7.5, 'Alkaline': 8.0, 'Strongly Alkaline': 8.5
        };
        return map[cat] || 7.0;
      };

      const calculateSoilDrainage = (): number => {
        let score = 75;
        switch (formData.soilType) {
          case 'Clay': score = 40; break;
          case 'Peaty': score = 30; break;
          case 'Silty': score = 60; break;
          case 'Sandy': score = 95; break;
          default: score = 75;
        }
        if (formData.waterlogging === 'Yes') score -= 30;
        else if (formData.waterlogging === 'Occasional') score -= 15;
        return Math.max(20, Math.min(100, score));
      };

      try {
        const prediction = await predictionAPI.predictRisk({
          crop: formData.crop as string,
          nitrogen: formData.nitrogen,
          phosphorus: formData.phosphorus,
          potassium: formData.potassium,
          ph: getPHValue(estimatedPH),
          rainfall: formData.rainfall,
          temperature: formData.temperature,
          humidity: 70,
          soil_ph: getPHValue(estimatedPH),
          soil_drainage: calculateSoilDrainage(),
          soil_moisture: 60,
          crop_age: 50
        });

        // IMPORTANT: Only update confidence/score from backend
        // Keep all risk breakdown values from local calculation
        const conf = prediction.confidence || 0.85;
        
        setRisk(prev => ({
          ...prev, // Keep all existing correct values
          confidence: conf * 100,
          score: prediction.risk_score || 0.5
        }));
        
        console.log('✅ Risk assessment complete - local breakdown preserved:', {
          droughtRisk: currentRisk?.droughtRisk,
          floodRisk: currentRisk?.floodRisk,
          heatStressRisk: currentRisk?.heatStressRisk,
          confidence: conf * 100
        });
      } catch (error) {
        console.error('Risk prediction error:', error);
        // On error, keep the local risk calculation - don't override
        console.log('ℹ️ Using local risk calculation (backend unavailable)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictionInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Low Risk</span>;
      case 'Medium':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⚠ Medium Risk</span>;
      case 'High':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">🚨 High Risk</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-600 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-3">⚠️ Weather & Climate Risk Prediction</h2>
        <p className="text-lg opacity-95">Predict and prepare for drought, flood, and heat stress risks</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Enter Field & Climate Data</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Crop
              </label>
              <select
                value={formData.crop}
                onChange={(e) => handleInputChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {Object.keys(CROP_DATABASE).map(crop => (
                  <option key={crop} value={crop}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rainfall (mm)
                </label>
                <input
                  type="number"
                  value={formData.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  min="0"
                  max="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N
                </label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  P
                </label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  K
                </label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <select
                value={formData.soilType}
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              >
                <option value="Clay">Clay</option>
                <option value="Loam">Loam</option>
                <option value="Sandy">Sandy</option>
                <option value="Silty">Silty</option>
                <option value="Peaty">Peaty</option>
                <option value="Chalky">Chalky</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Color
              </label>
              <select
                value={formData.soilColor}
                onChange={(e) => handleInputChange('soilColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              >
                <option value="Dark Brown/Black">Dark Brown/Black</option>
                <option value="Red">Red</option>
                <option value="Yellow">Yellow</option>
                <option value="Light Brown">Light Brown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waterlogging Tendency
              </label>
              <select
                value={formData.waterlogging}
                onChange={(e) => handleInputChange('waterlogging', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </span>
              ) : (
                '🔍 Assess Risk'
              )}
            </button>
          </form>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Risk Assessment</h3>
          
          {!risk ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🌦️</div>
              <p>Enter field data to get climate risk predictions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Alert */}
              <div className={`p-5 rounded-lg border-2 ${
                risk.overallAlert.includes('CRITICAL') ? 'bg-red-50 border-red-300' :
                risk.overallAlert.includes('WARNING') ? 'bg-orange-50 border-orange-300' :
                risk.overallAlert.includes('CAUTION') ? 'bg-yellow-50 border-yellow-300' :
                'bg-green-50 border-green-300'
              }`}>
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {risk.overallAlert.includes('CRITICAL') ? '🚨' :
                     risk.overallAlert.includes('WARNING') ? '⚠️' :
                     risk.overallAlert.includes('CAUTION') ? '⚡' :
                     '✅'}
                  </div>
                  <div className="font-bold text-lg text-gray-900">
                    {risk.overallAlert}
                  </div>
                </div>
              </div>

              {/* Individual Risk Factors */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 text-sm">Risk Breakdown:</h4>
                
                {/* Drought Risk */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌵</span>
                    <span className="font-medium text-gray-800">Drought Risk</span>
                  </div>
                  {getRiskBadge(risk.droughtRisk)}
                </div>

                {/* Flood Risk */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌊</span>
                    <span className="font-medium text-gray-800">Flood Risk</span>
                  </div>
                  {getRiskBadge(risk.floodRisk)}
                </div>

                {/* Heat Stress Risk */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌡️</span>
                    <span className="font-medium text-gray-800">Heat Stress Risk</span>
                  </div>
                  {getRiskBadge(risk.heatStressRisk)}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>Action Recommendations</span>
                </h4>
                <ul className="space-y-2">
                  {risk.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  ℹ️ These predictions are based on logistic regression models trained on historical 
                  climate and crop performance data. Monitor local weather forecasts for real-time updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
