import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, TrendingUp, Award, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Prediction {
  id: string;
  type: string;
  input_data: any;
  output_data: any;
  model_type: string;
  date: string;
  formatted_date: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Profile() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [userInfo, setUserInfo] = useState<any>(null);

  const fetchPredictions = async (page: number = 1, type: string = 'all') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/profile/predictions?page=${page}&limit=20&type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user info from localStorage
    const user = localStorage.getItem('currentUser');
    if (user) {
      setUserInfo(JSON.parse(user));
    }
    
    fetchPredictions(1, filterType);
  }, [filterType]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchPredictions(newPage, filterType);
    }
  };

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'yield':
        return '🌾';
      case 'crop':
        return '🌱';
      case 'risk':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case 'yield':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'crop':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'risk':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderPredictionDetails = (pred: Prediction) => {
    switch (pred.type) {
      case 'yield':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg text-green-700">
                {pred.output_data.yield} kg/hectare
              </span>
              <Badge variant="outline" className="bg-green-50">
                {(pred.output_data.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Rainfall: {pred.input_data.rainfall}mm</div>
              <div>Temperature: {pred.input_data.temperature}°C</div>
              <div>Nitrogen: {pred.input_data.nitrogen}</div>
              <div>Phosphorus: {pred.input_data.phosphorus}</div>
            </div>
          </div>
        );
      case 'crop':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg text-blue-700 capitalize">
                {pred.output_data.crop}
              </span>
              <Badge variant="outline" className="bg-blue-50">
                {(pred.output_data.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Rainfall: {pred.input_data.rainfall}mm</div>
              <div>Temperature: {pred.input_data.temperature}°C</div>
              <div>pH Level: {pred.input_data.ph_level}</div>
              <div>Soil Type: {pred.input_data.soil_type}</div>
            </div>
          </div>
        );
      case 'risk':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-semibold text-lg ${
                pred.output_data.risk_level === 'Low' ? 'text-green-700' :
                pred.output_data.risk_level === 'Medium' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {pred.output_data.risk_level} Risk
              </span>
              <Badge variant="outline" className="bg-orange-50">
                {(pred.output_data.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Temperature: {pred.input_data.temperature}°C</div>
              <div>Humidity: {pred.input_data.humidity}%</div>
              <div>Rainfall: {pred.input_data.rainfall}mm</div>
              <div>Crop Age: {pred.input_data.crop_age} days</div>
            </div>
          </div>
        );
      default:
        return <div>Unknown prediction type</div>;
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-gray-600">Please login to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-md">
                👤
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{userInfo.name}</h2>
                <p className="text-lg opacity-90">{userInfo.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Total Predictions</div>
              <div className="text-4xl font-bold">{pagination.total}</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="flex-1"
              >
                All ({pagination.total})
              </Button>
              <Button
                variant={filterType === 'yield' ? 'default' : 'outline'}
                onClick={() => setFilterType('yield')}
                className="flex-1"
              >
                🌾 Yield
              </Button>
              <Button
                variant={filterType === 'crop' ? 'default' : 'outline'}
                onClick={() => setFilterType('crop')}
                className="flex-1"
              >
                🌱 Crop
              </Button>
              <Button
                variant={filterType === 'risk' ? 'default' : 'outline'}
                onClick={() => setFilterType('risk')}
                className="flex-1"
              >
                ⚠️ Risk
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Predictions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-green-600" />
              <span>Prediction History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading predictions...</p>
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">No predictions found</p>
                <p className="text-sm text-gray-500 mt-2">Start making predictions to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.map((pred) => (
                  <Card key={pred.id} className={`border-2 ${getPredictionColor(pred.type)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{getPredictionIcon(pred.type)}</span>
                          <div>
                            <h3 className="font-semibold text-lg capitalize">
                              {pred.type} Prediction
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{pred.formatted_date}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pred.model_type}
                        </Badge>
                      </div>
                      {renderPredictionDetails(pred)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
