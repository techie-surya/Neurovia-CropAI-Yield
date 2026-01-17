import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, MapPin, Leaf, TrendingUp, Calendar, CloudRain } from 'lucide-react';
import { predictionAPI } from '../utils/api';

interface PredictionFormData {
  cropType: string;
  landArea: number;
  landAreaUnit: 'acre' | 'hectare';
  location: string;
  region: string;
  soilPH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilMoisture: number;
  season: 'Kharif' | 'Rabi' | 'Summer';
  temperature: number;
  rainfall: number;
  humidity: number;
}

export default function EnhancedPredictionForm() {
  const [formData, setFormData] = useState<PredictionFormData>({
    cropType: 'rice',
    landArea: 1,
    landAreaUnit: 'acre',
    location: '',
    region: '',
    soilPH: 7.0,
    nitrogen: 80,
    phosphorus: 40,
    potassium: 40,
    soilMoisture: 50,
    season: 'Kharif',
    temperature: 25,
    rainfall: 1200,
    humidity: 65
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weatherDataFetched, setWeatherDataFetched] = useState(false);

  // Auto-fetch weather data from Weather section on component mount
  useEffect(() => {
    try {
      const weatherCache = localStorage.getItem('autoWeatherCache');
      if (weatherCache) {
        const weatherData = JSON.parse(weatherCache);
        
        // Extract location address (city name)
        const locationAddress = weatherData.location?.address || '';
        const cityMatch = locationAddress.match(/([^,]+)/); // Get first part before comma
        const city = cityMatch ? cityMatch[1].trim() : '';
        
        setFormData(prev => ({
          ...prev,
          location: city || prev.location,
          temperature: Math.round(weatherData.current?.temperature ?? prev.temperature),
          rainfall: Math.round(weatherData.current?.rainfall ?? prev.rainfall),
          humidity: weatherData.current?.humidity ?? prev.humidity
        }));
        
        setWeatherDataFetched(true);
      }
    } catch (err) {
      console.warn('Could not fetch weather data from cache:', err);
    }
  }, []);

  const crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 'Millet'];
  const regions = ['North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India'];
  const seasons = ['Kharif', 'Rabi', 'Summer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');

      // Convert land area to hectares for consistency
      const landAreaInHectares = formData.landAreaUnit === 'acre' 
        ? formData.landArea * 0.404686 
        : formData.landArea;

      const prediction = await predictionAPI.predictYield({
        crop: formData.cropType,
        nitrogen: formData.nitrogen,
        phosphorus: formData.phosphorus,
        potassium: formData.potassium,
        ph: formData.soilPH,
        rainfall: formData.rainfall,
        temperature: formData.temperature
      });

      // Make outputs crop-aware even when backend returns a flat value
      const cropKey = formData.cropType.trim().toLowerCase();
      // Crop-aware baseline yields (kg/ha), derived from dataset ranges to avoid uniform outputs
      const baseYieldByCrop: Record<string, number> = {
        rice: 3200,
        wheat: 3000,
        maize: 3500,
        cotton: 1200,
        sugarcane: 80000, // kg/ha for whole season
        soybean: 2200,
        groundnut: 1800,
        millet: 1600
      };
      const basePriceByCrop: Record<string, number> = {
        rice: 21,
        wheat: 22,
        maize: 19,
        cotton: 62,
        sugarcane: 3,
        soybean: 45,
        groundnut: 55,
        millet: 18
      };

      // Calculate yield based on inputs rather than trusting backend (which returns same value for all crops)
      const baseYield = baseYieldByCrop[cropKey] ?? 3500;
      const optimalN = 80, optimalP = 50, optimalK = 50; // Optimal NPK values
      
      // Season factor: Different crops perform better in different seasons
      const seasonOptimalCrops: Record<string, string[]> = {
        'Kharif': ['rice', 'maize', 'cotton', 'soybean', 'groundnut', 'millet'],
        'Rabi': ['wheat', 'barley', 'mustard', 'chickpea'],
        'Summer': ['sugarcane', 'watermelon', 'cucumber']
      };
      const isOptimalSeason = seasonOptimalCrops[formData.season]?.includes(cropKey);
      const seasonFactor = isOptimalSeason ? 1.0 : 0.75; // 25% penalty for wrong season
      
      // Calculate nutrient factors (0.6 to 1.4 range based on how close to optimal)
      const nFactor = 0.6 + (0.8 * Math.min(formData.nitrogen / optimalN, 1.5));
      const pFactor = 0.6 + (0.8 * Math.min(formData.phosphorus / optimalP, 1.5));
      const kFactor = 0.6 + (0.8 * Math.min(formData.potassium / optimalK, 1.5));
      
      // pH factor (optimal around 6.5-7.0)
      const phDiff = Math.abs(formData.soilPH - 6.75);
      const phFactor = Math.max(0.7, 1 - (phDiff * 0.15));
      
      // Rainfall factor (optimal range varies by crop)
      const optimalRainfall = cropKey === 'rice' ? 1200 : cropKey === 'wheat' ? 600 : 800;
      const rainfallRatio = formData.rainfall / optimalRainfall;
      const rainfallFactor = rainfallRatio < 0.5 ? 0.5 : rainfallRatio > 1.5 ? 0.8 : (0.7 + 0.3 * Math.min(rainfallRatio, 1.2));
      
      // Combine factors (including season)
      const avgFactor = (nFactor + pFactor + kFactor + phFactor + rainfallFactor) / 5;
      const yieldPerHectare = baseYield * avgFactor * seasonFactor;

      const marketPrice = typeof prediction.price === 'number'
        ? prediction.price
        : (basePriceByCrop[cropKey] ?? 25);

      const totalYield = yieldPerHectare * landAreaInHectares;
      const totalRevenue = totalYield * marketPrice; // totalYield in kg, marketPrice in ₹/kg

      // Derive a simple risk score from model confidence (higher confidence = lower risk)
      const riskScore = Math.max(5, Math.min(95, Math.round((1 - (prediction.confidence ?? 0.7)) * 100)));
      const riskLevel = riskScore <= 20 ? 'Low' : riskScore <= 50 ? 'Medium' : 'High';

      setResult({
        cropType: formData.cropType,
        location: formData.location,
        landArea: formData.landArea,
        landAreaUnit: formData.landAreaUnit,
        season: formData.season,
        yieldPerHectare: yieldPerHectare,
        totalYield: totalYield,
        totalRevenue: totalRevenue,
        confidence: prediction.confidence,
        saved: prediction.saved,
        message: prediction.message,
        riskScore,
        riskLevel,
        recommendations: [
          'Based on your soil and weather conditions',
          `Estimated yield: ${(totalYield / 100).toFixed(2)} quintals`,
          `Expected revenue: ₹${totalRevenue.toFixed(0)}`,
          'Monitor soil moisture during critical growth stages'
        ]
      });

      if (token) {
        // Auto-save for logged-in users
        await fetch('http://localhost:5000/api/save-detailed-prediction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            result: {
              yield: totalYield,
              revenue: totalRevenue,
              confidence: prediction.confidence
            }
          })
        });
      }
    } catch (err: any) {
      setError(err.message || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-8 pb-8 pt-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-green-600 text-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-3">📈 Smart Yield & Revenue Prediction</h2>
          <p className="text-lg opacity-95">Get accurate predictions based on your land, soil, and weather conditions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Farm Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Crop Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {crops.map(crop => (
                      <option key={crop} value={crop.toLowerCase()}>{crop}</option>
                    ))}
                  </select>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season *
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) => handleInputChange('season', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {seasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Kharif (Jun-Oct), Rabi (Oct-Mar), Summer (Mar-Jun)</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location/District *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Mumbai, Nashik"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Land Area */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land Area *</label>
                    <input
                      type="number"
                      value={formData.landArea}
                      onChange={(e) => handleInputChange('landArea', parseFloat(e.target.value))}
                      min="0.1"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={formData.landAreaUnit}
                      onChange={(e) => handleInputChange('landAreaUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="acre">Acre</option>
                      <option value="hectare">Hectare</option>
                    </select>
                  </div>
                </div>

                {/* Soil Parameters */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Soil Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nitrogen (N)</label>
                      <input
                        type="number"
                        value={formData.nitrogen}
                        onChange={(e) => handleInputChange('nitrogen', parseFloat(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">kg/hectare</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phosphorus (P)</label>
                      <input
                        type="number"
                        value={formData.phosphorus}
                        onChange={(e) => handleInputChange('phosphorus', parseFloat(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">kg/hectare</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (K)</label>
                      <input
                        type="number"
                        value={formData.potassium}
                        onChange={(e) => handleInputChange('potassium', parseFloat(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">kg/hectare</p>
                    </div>
                  </div>
                </div>

                {/* Weather Parameters */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 text-sm">Weather Parameters</h4>
                    </div>
                  
                    {weatherDataFetched && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-xs mb-3 flex items-start space-x-2">
                        <CloudRain className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Weather data auto-filled from Weather section. You can still edit manually if needed.</span>
                      </div>
                    )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                      <input
                        type="number"
                        value={formData.humidity}
                        onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rainfall (mm)</label>
                      <input
                        type="number"
                        value={formData.rainfall}
                        onChange={(e) => handleInputChange('rainfall', parseFloat(e.target.value))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold"
                >
                  {loading ? 'Analyzing...' : 'Predict Yield & Revenue'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="font-medium">Fill the form and click predict</p>
                  <p className="text-sm mt-2">Get accurate yield and revenue estimates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.message && (
                    <div className={`p-4 rounded-lg border-2 ${result.saved ? 'bg-green-50 border-green-300 text-green-800' : 'bg-blue-50 border-blue-300 text-blue-800'}`}>
                      <span className="font-medium">{result.saved ? '✅' : 'ℹ️'} {result.message}</span>
                    </div>
                  )}

                  {/* Crop & Location Info */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">Crop</div>
                        <div className="font-bold text-green-700 capitalize">{result.cropType}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Season</div>
                        <div className="font-bold text-green-700">{result.season}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Location</div>
                        <div className="font-bold text-green-700">{result.location}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Land Area</div>
                        <div className="font-bold text-green-700">{result.landArea} {result.landAreaUnit}</div>
                      </div>
                    </div>
                  </div>

                  {/* Yield */}
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="text-sm text-gray-600">Total Yield Expected</div>
                    <div className="text-3xl font-bold text-blue-700">
                      {(result.totalYield / 100).toFixed(2)} Quintals
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {result.yieldPerHectare.toFixed(0)} kg/hectare
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                    <div className="text-sm text-gray-600">Expected Revenue</div>
                    <div className="text-3xl font-bold text-emerald-700">
                      ₹{result.totalRevenue.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      At current market rates
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 flex items-start justify-between gap-3">
                    {/* Added generous padding so content doesn't merge with border */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                      <div className="text-2xl font-bold text-green-700">{result.riskLevel}</div>
                      <div className="text-sm text-gray-700 mt-1">Risk Score: {result.riskScore}%</div>
                    </div>
                    <div className="text-4xl" aria-hidden>
                      ✅
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-900">Model Confidence</span>
                      <span className="text-lg font-bold text-purple-700">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="font-semibold text-amber-900 mb-2">📋 Recommendations</div>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {result.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
