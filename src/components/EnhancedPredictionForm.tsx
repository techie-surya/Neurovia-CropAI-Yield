import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, MapPin, Leaf, TrendingUp, Calendar } from 'lucide-react';
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

      const yieldPerHectare = prediction.yield || 4000;
      const totalYield = yieldPerHectare * landAreaInHectares;
      const marketPrice = 25; // Default price, should be fetched from API
      const totalRevenue = (totalYield / 100) * marketPrice; // Convert to quintals

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
                <Leaf className="w-5 h-5" />
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
                    <Calendar className="w-4 h-4 inline mr-1" />
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

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region/State</label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
                      <input
                        type="number"
                        value={formData.soilPH}
                        onChange={(e) => handleInputChange('soilPH', parseFloat(e.target.value))}
                        min="4"
                        max="9"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optimal: 6.5-7.5</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Moisture (%)</label>
                      <input
                        type="number"
                        value={formData.soilMoisture}
                        onChange={(e) => handleInputChange('soilMoisture', parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

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
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Weather Parameters</h4>
                  
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
