import { useState } from 'react';
import { CROP_DATABASE, type CropName, type PredictionInput, optimizeFertilizer, optimizeIrrigation, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';

export function FertilizerOptimization() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<PredictionInput>({
    crop: 'rice',
    nitrogen: 50,
    phosphorus: 25,
    potassium: 30,
    soilType: 'Loam',
    soilColor: 'Dark Brown/Black',
    waterlogging: 'No',
    phCategory: 'Neutral',
    rainfall: 800,
    temperature: 28
  });

  const [fertilizerRec, setFertilizerRec] = useState<any>(null);
  const [irrigationRec, setIrrigationRec] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Calculate pH category from soil characteristics
    const estimatedPH = estimateSoilPH(formData.soilType, formData.soilColor, formData.waterlogging);
    const updatedFormData = { ...formData, phCategory: estimatedPH };
    setFormData(updatedFormData);

    setTimeout(() => {
      const fertilizer = optimizeFertilizer(updatedFormData);
      const irrigation = optimizeIrrigation(updatedFormData);
      setFertilizerRec(fertilizer);
      setIrrigationRec(irrigation);
      setIsLoading(false);
    }, 700);
  };

  const handleInputChange = (field: keyof PredictionInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-600 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-3">🌿 Fertilizer & Water Optimization</h2>
        <p className="text-lg opacity-95">Optimize resource usage and maximize crop yield with AI recommendations</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Field Information</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Crop
              </label>
              <select
                value={formData.crop}
                onChange={(e) => handleInputChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Object.keys(CROP_DATABASE).map(crop => (
                  <option key={crop} value={crop}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  P (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  K (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="200"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Optimizing...
                </span>
              ) : (
                '⚡ Optimize Resources'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!fertilizerRec ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🧪</div>
              <p>Enter your field data to get optimization recommendations</p>
            </div>
          ) : (
            <>
              {/* Fertilizer Recommendations */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🧪</span>
                  <h3 className="font-semibold text-gray-800">Fertilizer Recommendations</h3>
                </div>

                {fertilizerRec.totalFertilizer === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">✅ {fertilizerRec.explanation}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* NPK Requirements */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">Nitrogen (N)</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {fertilizerRec.nitrogenNeeded}
                        </div>
                        <div className="text-xs text-blue-600">kg/ha</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm text-green-600 mb-1">Phosphorus (P)</div>
                        <div className="text-2xl font-bold text-green-900">
                          {fertilizerRec.phosphorusNeeded}
                        </div>
                        <div className="text-xs text-green-600">kg/ha</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-600 mb-1">Potassium (K)</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {fertilizerRec.potassiumNeeded}
                        </div>
                        <div className="text-xs text-purple-600">kg/ha</div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Fertilizer</span>
                        <span className="text-2xl font-bold text-orange-700">
                          {fertilizerRec.totalFertilizer} kg/ha
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Estimated Cost</span>
                        <span className="text-xl font-bold text-green-700">
                          ₹{fertilizerRec.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Yield Improvement */}
                    {fertilizerRec.yieldImprovement > 0 && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📈</span>
                          <div>
                            <div className="text-sm text-green-700 font-medium">Expected Yield Improvement</div>
                            <div className="text-2xl font-bold text-green-800">
                              +{fertilizerRec.yieldImprovement}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        💡 {fertilizerRec.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Irrigation Recommendations */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💧</span>
                  <h3 className="font-semibold text-gray-800">Irrigation Recommendations</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Frequency</div>
                      <div className="text-lg font-bold text-blue-900">
                        {irrigationRec.frequency}
                      </div>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                      <div className="text-sm text-cyan-600 mb-1">Water/Week</div>
                      <div className="text-lg font-bold text-cyan-900">
                        {irrigationRec.waterPerWeek.toLocaleString()} L/ha
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Recommended Method</div>
                    <div className="text-xl font-bold text-blue-900">
                      {irrigationRec.method}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      💡 {irrigationRec.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
