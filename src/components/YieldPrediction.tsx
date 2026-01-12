import { useState } from 'react';
import { CROP_DATABASE, type CropName, type PredictionInput, predictCropYield, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';

interface YieldPredictionProps {
  onPredictionComplete?: (input: PredictionInput) => void;
}

export function YieldPrediction({ onPredictionComplete }: YieldPredictionProps) {
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
    rainfall: 1200,
    temperature: 28
  });

  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Calculate pH category from soil characteristics
    const estimatedPH = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
    const updatedFormData = { ...formData, phCategory: estimatedPH };
    setFormData(updatedFormData);

    // Simulate ML prediction delay
    setTimeout(() => {
      const prediction = predictCropYield(updatedFormData);
      setResult(prediction);
      setIsLoading(false);
      
      if (onPredictionComplete) {
        onPredictionComplete(updatedFormData);
      }
    }, 800);
  };

  const handleInputChange = (field: keyof PredictionInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🌾 {t('aiCropYield')}</h2>
        <p className="opacity-90">{t('yieldPredictionDesc2')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">{t('enterFieldParameters')}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Crop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('selectCrop')}
              </label>
              <select
                value={formData.crop}
                onChange={(e) => handleInputChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.keys(CROP_DATABASE).map(crop => (
                  <option key={crop} value={crop}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Soil Nutrients */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('nitrogen')}
                </label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="kg/ha"
                  min="0"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phosphorus')}
                </label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="kg/ha"
                  min="0"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('potassium')}
                </label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="kg/ha"
                  min="0"
                  max="200"
                />
              </div>
            </div>

            {/* Soil Characteristics */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('soilType')}
                </label>
                <select
                  value={formData.soilType}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Occasional">Occasional</option>
                </select>
              </div>
            </div>

            {/* Weather */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('rainfall')}
                </label>
                <input
                  type="number"
                  value={formData.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Annual"
                  min="0"
                  max="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('temperature')}
                </label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Average"
                  min="0"
                  max="50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </span>
              ) : (
                '🔮 Predict Yield'
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Prediction Results</h3>
          
          {!result ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <p>Enter field parameters and click "Predict Yield" to see AI predictions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Predicted Yield */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Predicted Yield</div>
                <div className="text-4xl font-bold text-green-700">
                  {result.predictedYield.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">kg/hectare</div>
              </div>

              {/* Risk Level */}
              <div className={`p-4 rounded-lg border-2 ${getRiskColor(result.riskLevel)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t('riskLevelLabel')}</div>
                    <div className="text-2xl font-bold mt-1">{result.riskLevel}</div>
                  </div>
                  <div className="text-4xl">
                    {result.riskLevel === 'Low' ? '✅' : result.riskLevel === 'Medium' ? '⚠️' : '🚨'}
                  </div>
                </div>
                <div className="mt-2 text-sm">Risk Score: {result.riskScore}%</div>
              </div>

              {/* Model Confidence */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Model Confidence</span>
                  <span className="text-lg font-bold text-blue-700">{result.confidence}%</span>
                </div>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              {/* Estimated Soil pH */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-900">Soil pH (Estimated)</span>
                  <span className="text-lg font-bold text-amber-700">{formData.phCategory}</span>
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Based on soil type, color, and waterlogging
                </div>
              </div>

              {/* Factor Scores */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Contributing Factors:</div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>🌱 Soil Health</span>
                      <span className="font-medium">{result.factors.soilHealth}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${result.factors.soilHealth}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>🌦️ Weather Suitability</span>
                      <span className="font-medium">{result.factors.weatherSuitability}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${result.factors.weatherSuitability}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>⚖️ Nutrient Balance</span>
                      <span className="font-medium">{result.factors.nutrientBalance}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${result.factors.nutrientBalance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
