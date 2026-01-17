import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CROP_DATABASE, type CropName, type PredictionInput, calculateFeatureImportance, predictCropYield, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';

export function ExplainableAI() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<PredictionInput>({
    crop: 'rice',
    nitrogen: 60,
    phosphorus: 30,
    potassium: 35,
    soilType: 'Loam',
    soilColor: 'Dark Brown/Black',
    waterlogging: 'No',
    phCategory: 'Neutral',
    rainfall: 900,
    temperature: 26
  });

  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill rainfall and temperature from weather cache
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
      console.warn('ExplainableAI: failed to hydrate from weather cache', err);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Calculate pH category from soil characteristics
    const estimatedPH = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
    const updatedFormData = { ...formData, phCategory: estimatedPH };
    setFormData(updatedFormData);

    setTimeout(() => {
      const features = calculateFeatureImportance(updatedFormData);
      const prediction = predictCropYield(updatedFormData);
      setAnalysis({ features, prediction });
      setIsLoading(false);
    }, 800);
  };

  const handleInputChange = (field: keyof PredictionInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Positive': return '#10b981';
      case 'Moderate': return '#f59e0b';
      case 'Negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Positive': return '✅';
      case 'Moderate': return '⚠️';
      case 'Negative': return '❌';
      default: return '➖';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🧠 Explainable AI - Feature Importance Analysis</h2>
        <p className="opacity-90">Understand which factors affect your crop yield the most and why</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Enter Field Data</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type
              </label>
              <select
                value={formData.crop}
                onChange={(e) => handleInputChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {Object.keys(CROP_DATABASE).map(crop => (
                  <option key={crop} value={crop}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">N</label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">P</label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">K</label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
              <select
                value={formData.soilType}
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Color</label>
              <select
                value={formData.soilColor}
                onChange={(e) => handleInputChange('soilColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
              >
                <option value="Dark Brown/Black">Dark Brown/Black</option>
                <option value="Red">Red</option>
                <option value="Yellow">Yellow</option>
                <option value="Light Brown">Light Brown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waterlogging Tendency</label>
              <select
                value={formData.waterlogging}
                onChange={(e) => handleInputChange('waterlogging', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall (mm)</label>
              <input
                type="number"
                value={formData.rainfall}
                onChange={(e) => handleInputChange('rainfall', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                min="0"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 text-white py-3 rounded-md hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </span>
              ) : (
                '🔍 Analyze Impact'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="md:col-span-2 space-y-6">
          {!analysis ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🧠</div>
              <p>Enter your field data to see which factors affect your yield the most</p>
            </div>
          ) : (
            <>
              {/* Prediction Summary */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">AI Prediction Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Predicted Yield</div>
                    <div className="text-3xl font-bold text-green-700">
                      {analysis.prediction.predictedYield.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">kg/hectare</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Model Confidence</div>
                    <div className="text-3xl font-bold text-blue-700">
                      {analysis.prediction.confidence}%
                    </div>
                    <div className="text-sm text-gray-600">AI Certainty</div>
                  </div>
                </div>
              </div>

              {/* Feature Importance Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Feature Importance Ranking</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Higher values indicate stronger impact on yield prediction
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysis.features} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" label={{ value: 'Importance Score', position: 'insideBottom', offset: -5 }} />
                    <YAxis type="category" dataKey="feature" width={100} />
                    <Tooltip />
                    <Bar dataKey="importance" name="Importance">
                      {analysis.features.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getImpactColor(entry.impact)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Factor Analysis */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-800">Detailed Factor Analysis</h3>
                <div className="space-y-3">
                  {analysis.features.map((feature: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getImpactIcon(feature.impact)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{feature.feature}</h4>
                            <span
                              className="text-sm font-medium"
                              style={{ color: getImpactColor(feature.impact) }}
                            >
                              {feature.impact} Impact
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-700">
                            {feature.importance}
                          </div>
                          <div className="text-xs text-gray-500">Importance</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${feature.importance}%`,
                              backgroundColor: getImpactColor(feature.impact)
                            }}
                          />
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">💡 Recommendation: </span>
                          {feature.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>ℹ️ About the Model:</strong> This analysis uses a Random Forest classifier 
                  trained on agricultural datasets. Feature importance is calculated using mean decrease 
                  in impurity (Gini importance), which measures how much each feature contributes to 
                  reducing prediction uncertainty across all decision trees in the forest.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
