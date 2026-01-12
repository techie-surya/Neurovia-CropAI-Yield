import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CROP_DATABASE, type CropName, type PredictionInput, predictCropYield, estimateSoilPH } from '../utils/mockMLModels';
import { useI18n } from '../context/LanguageContext';

export function WhatIfSimulator() {
  const { t } = useI18n();
  // Baseline values (original)
  const [baseline, setBaseline] = useState<PredictionInput>({
    crop: 'rice',
    nitrogen: 60,
    phosphorus: 30,
    potassium: 35,
    soilType: 'Loam',
    soilColor: 'Dark Brown/Black',
    waterlogging: 'No',
    phCategory: 'Neutral',
    rainfall: 900,
    temperature: 28
  });

  // Simulated values (modified)
  const [simulated, setSimulated] = useState<PredictionInput>({
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

  const [hasSimulated, setHasSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    
    // Calculate pH categories from soil characteristics
    const baselinePH = estimateSoilPH(baseline.soilType, baseline.soilColor, baseline.waterlogging);
    const simulatedPH = estimateSoilPH(simulated.soilType, simulated.soilColor, simulated.waterlogging);
    
    setBaseline(prev => ({ ...prev, phCategory: baselinePH }));
    setSimulated(prev => ({ ...prev, phCategory: simulatedPH }));
    
    setTimeout(() => {
      setHasSimulated(true);
      setIsSimulating(false);
    }, 1000);
  };

  const handleReset = () => {
    setSimulated({ ...baseline });
    setHasSimulated(false);
  };

  const handleBaselineChange = (field: keyof PredictionInput, value: string | number) => {
    const newValue = typeof value === 'string' ? value : Number(value);
    setBaseline(prev => ({ ...prev, [field]: newValue }));
    setSimulated(prev => ({ ...prev, [field]: newValue }));
    setHasSimulated(false);
  };

  const handleSimulatedChange = (field: keyof PredictionInput, value: string | number) => {
    setSimulated(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
    setHasSimulated(false);
  };

  // Calculate predictions
  const baselinePrediction = predictCropYield(baseline);
  const simulatedPrediction = hasSimulated ? predictCropYield(simulated) : null;

  // Calculate differences
  const yieldDiff = simulatedPrediction 
    ? simulatedPrediction.predictedYield - baselinePrediction.predictedYield
    : 0;
  const yieldDiffPercent = simulatedPrediction
    ? Math.round((yieldDiff / baselinePrediction.predictedYield) * 100)
    : 0;

  // Prepare chart data
  const yieldComparisonData = [
    {
      name: 'Baseline',
      yield: baselinePrediction.predictedYield,
    },
    {
      name: 'Simulated',
      yield: simulatedPrediction?.predictedYield || 0,
    }
  ];

  const factorComparisonData = [
    {
      factor: 'Soil Health',
      baseline: baselinePrediction.factors.soilHealth,
      simulated: simulatedPrediction?.factors.soilHealth || 0
    },
    {
      factor: 'Weather',
      baseline: baselinePrediction.factors.weatherSuitability,
      simulated: simulatedPrediction?.factors.weatherSuitability || 0
    },
    {
      factor: 'Nutrients',
      baseline: baselinePrediction.factors.nutrientBalance,
      simulated: simulatedPrediction?.factors.nutrientBalance || 0
    }
  ];

  const inputComparisonData = [
    { name: 'N', baseline: baseline.nitrogen, simulated: simulated.nitrogen },
    { name: 'P', baseline: baseline.phosphorus, simulated: simulated.phosphorus },
    { name: 'K', baseline: baseline.potassium, simulated: simulated.potassium },
    { name: 'Rainfall', baseline: baseline.rainfall / 10, simulated: simulated.rainfall / 10 },
    { name: 'Temp', baseline: baseline.temperature, simulated: simulated.temperature }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🎯 What-If Scenario Simulator</h2>
        <p className="opacity-90">Compare different farming scenarios in real-time without retraining the model</p>
      </div>

      {/* Input Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Baseline Scenario */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📋</span>
            <h3 className="font-semibold text-gray-800">Baseline Scenario (Current)</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
              <select
                value={baseline.crop}
                onChange={(e) => handleBaselineChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">N</label>
                <input
                  type="number"
                  value={baseline.nitrogen}
                  onChange={(e) => handleBaselineChange('nitrogen', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">P</label>
                <input
                  type="number"
                  value={baseline.phosphorus}
                  onChange={(e) => handleBaselineChange('phosphorus', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">K</label>
                <input
                  type="number"
                  value={baseline.potassium}
                  onChange={(e) => handleBaselineChange('potassium', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
              <select
                value={baseline.soilType}
                onChange={(e) => handleBaselineChange('soilType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                value={baseline.soilColor}
                onChange={(e) => handleBaselineChange('soilColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="Dark Brown/Black">Dark Brown/Black</option>
                <option value="Red">Red</option>
                <option value="Yellow">Yellow</option>
                <option value="Light Brown">Light Brown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waterlogging</label>
              <select
                value={baseline.waterlogging}
                onChange={(e) => handleBaselineChange('waterlogging', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall</label>
                <input
                  type="number"
                  value={baseline.rainfall}
                  onChange={(e) => handleBaselineChange('rainfall', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  value={baseline.temperature}
                  onChange={(e) => handleBaselineChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Baseline Result */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Baseline Yield</div>
              <div className="text-3xl font-bold text-blue-700">
                {baselinePrediction.predictedYield.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">kg/hectare</div>
            </div>
          </div>
        </div>

        {/* Simulated Scenario */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔬</span>
            <h3 className="font-semibold text-gray-800">Simulated Scenario (Modified)</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
              <select
                value={simulated.crop}
                onChange={(e) => handleSimulatedChange('crop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">N</label>
                <input
                  type="number"
                  value={simulated.nitrogen}
                  onChange={(e) => handleSimulatedChange('nitrogen', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">P</label>
                <input
                  type="number"
                  value={simulated.phosphorus}
                  onChange={(e) => handleSimulatedChange('phosphorus', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">K</label>
                <input
                  type="number"
                  value={simulated.potassium}
                  onChange={(e) => handleSimulatedChange('potassium', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
              <select
                value={simulated.soilType}
                onChange={(e) => handleSimulatedChange('soilType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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
                value={simulated.soilColor}
                onChange={(e) => handleSimulatedChange('soilColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="Dark Brown/Black">Dark Brown/Black</option>
                <option value="Red">Red</option>
                <option value="Yellow">Yellow</option>
                <option value="Light Brown">Light Brown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waterlogging</label>
              <select
                value={simulated.waterlogging}
                onChange={(e) => handleSimulatedChange('waterlogging', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall</label>
                <input
                  type="number"
                  value={simulated.rainfall}
                  onChange={(e) => handleSimulatedChange('rainfall', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  value={simulated.temperature}
                  onChange={(e) => handleSimulatedChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
            </div>

            {/* Simulated Result */}
            {hasSimulated && simulatedPrediction && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Simulated Yield</div>
                <div className="text-3xl font-bold text-green-700">
                  {simulatedPrediction.predictedYield.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">kg/hectare</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
        >
          {isSimulating ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Simulating...
            </span>
          ) : (
            '🚀 Run Simulation'
          )}
        </button>
        <button
          onClick={handleReset}
          className="px-8 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors shadow-lg"
        >
          🔄 Reset
        </button>
      </div>

      {/* Results Visualization */}
      {hasSimulated && simulatedPrediction && (
        <div className="space-y-6 animate-fadeIn">
          {/* Impact Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span>📊</span>
              <span>Simulation Impact Analysis</span>
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-lg border-2 ${
                yieldDiff > 0 ? 'bg-green-50 border-green-300' : 
                yieldDiff < 0 ? 'bg-red-50 border-red-300' : 
                'bg-gray-50 border-gray-300'
              }`}>
                <div className="text-sm text-gray-600 mb-1">Yield Change</div>
                <div className={`text-3xl font-bold ${
                  yieldDiff > 0 ? 'text-green-700' : 
                  yieldDiff < 0 ? 'text-red-700' : 
                  'text-gray-700'
                }`}>
                  {yieldDiff > 0 ? '+' : ''}{yieldDiff.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">kg/hectare</div>
              </div>

              <div className={`p-5 rounded-lg border-2 ${
                yieldDiffPercent > 0 ? 'bg-green-50 border-green-300' : 
                yieldDiffPercent < 0 ? 'bg-red-50 border-red-300' : 
                'bg-gray-50 border-gray-300'
              }`}>
                <div className="text-sm text-gray-600 mb-1">Percentage Change</div>
                <div className={`text-3xl font-bold ${
                  yieldDiffPercent > 0 ? 'text-green-700' : 
                  yieldDiffPercent < 0 ? 'text-red-700' : 
                  'text-gray-700'
                }`}>
                  {yieldDiffPercent > 0 ? '+' : ''}{yieldDiffPercent}%
                </div>
                <div className="text-sm text-gray-600">
                  {yieldDiffPercent > 0 ? '📈 Improvement' : yieldDiffPercent < 0 ? '📉 Decline' : '➡️ No Change'}
                </div>
              </div>

              <div className={`p-5 rounded-lg border-2 ${
                simulatedPrediction.riskLevel === 'Low' ? 'bg-green-50 border-green-300' :
                simulatedPrediction.riskLevel === 'Medium' ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                <div className="text-2xl font-bold text-gray-800">
                  {simulatedPrediction.riskLevel}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {baselinePrediction.riskLevel} → {simulatedPrediction.riskLevel}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {yieldDiffPercent !== 0 && (
              <div className={`mt-4 p-4 rounded-lg border ${
                yieldDiffPercent > 5 ? 'bg-green-50 border-green-300' :
                yieldDiffPercent < -5 ? 'bg-red-50 border-red-300' :
                'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {yieldDiffPercent > 5 ? '✅' : yieldDiffPercent < -5 ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <h4 className="font-semibold mb-1">
                      {yieldDiffPercent > 5 ? 'Recommended Change' :
                       yieldDiffPercent < -5 ? 'Warning' :
                       'Minor Impact'}
                    </h4>
                    <p className="text-sm">
                      {yieldDiffPercent > 5 ? 
                        `This simulation shows a ${yieldDiffPercent}% improvement in yield. Consider implementing these changes for better harvest.` :
                       yieldDiffPercent < -5 ?
                        `This simulation predicts a ${Math.abs(yieldDiffPercent)}% decrease in yield. Avoid these conditions.` :
                        'The changes have minimal impact on overall yield.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Yield Comparison Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-800">Yield Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yieldComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Yield (kg/ha)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="yield" fill="#3b82f6" name="Predicted Yield" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor Comparison */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-800">Contributing Factors Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={factorComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="factor" />
                <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#3b82f6" name="Baseline" />
                <Bar dataKey="simulated" fill="#10b981" name="Simulated" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Input Parameters Comparison */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-800">Input Parameters Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inputComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={2} name="Baseline" />
                <Line type="monotone" dataKey="simulated" stroke="#10b981" strokeWidth={2} name="Simulated" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              * Rainfall values divided by 10 for visualization
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
