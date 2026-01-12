import { useState } from 'react';
import { recommendCrops, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';

export function CropRecommendation() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    nitrogen: 80,
    phosphorus: 40,
    potassium: 40,
    soilType: 'Loam',
    soilColor: 'Dark Brown/Black',
    waterlogging: 'No',
    rainfall: 800,
    temperature: 25
  });

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const phCategory = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
      const result = recommendCrops(
        formData.nitrogen,
        formData.phosphorus,
        formData.potassium,
        phCategory,
        formData.rainfall,
        formData.temperature
      );
      setRecommendations(result);
      setIsLoading(false);
    }, 700);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: ['nitrogen', 'phosphorus', 'potassium', 'rainfall', 'temperature'].includes(field) 
        ? Number(value) 
        : value
    }));
  };

  const getMedalEmoji = (index: number) => {
    return ['🥇', '🥈', '🥉'][index] || '🏅';
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🌾 Smart Crop Recommendation</h2>
        <p className="opacity-90">AI-powered crop selection based on your soil and climate conditions</p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Input Form - Narrower */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Soil & Climate Data</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NPK */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nitrogen (kg/ha)
              </label>
              <input
                type="number"
                value={formData.nitrogen}
                onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phosphorus (kg/ha)
              </label>
              <input
                type="number"
                value={formData.phosphorus}
                onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potassium (kg/ha)
              </label>
              <input
                type="number"
                value={formData.potassium}
                onChange={(e) => handleInputChange('potassium', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <select
                value={formData.soilType}
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rainfall (mm)
              </label>
              <input
                type="number"
                value={formData.rainfall}
                onChange={(e) => handleInputChange('rainfall', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </span>
              ) : (
                '🔍 Find Best Crops'
              )}
            </button>
          </form>
        </div>

        {/* Recommendations - Wider */}
        <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Recommended Crops</h3>
          
          {recommendations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🌱</div>
              <p>Enter your soil and climate data to get personalized crop recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.crop}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{getMedalEmoji(index)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-800 capitalize">
                            {rec.crop}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(rec.suitabilityScore)}`}>
                            {rec.suitabilityScore}% Match
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{rec.reason}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Expected Yield:</span>
                            <span className="font-semibold text-green-700">
                              {rec.expectedYield.toLocaleString()} kg/ha
                            </span>
                          </div>
                          
                          {index === 0 && (
                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                              <span>⭐</span>
                              <span>Best Choice</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suitability Bar */}
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          rec.suitabilityScore >= 75 ? 'bg-green-600' :
                          rec.suitabilityScore >= 60 ? 'bg-yellow-600' :
                          'bg-orange-600'
                        }`}
                        style={{ width: `${rec.suitabilityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">AI Recommendation Tip</h4>
                    <p className="text-sm text-blue-800">
                      These recommendations are based on machine learning analysis of your soil nutrients, 
                      pH levels, and climate conditions. The top choice offers the best yield potential 
                      for your specific conditions.
                    </p>
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
