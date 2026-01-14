import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Filter, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface PredictionRecord {
  id: string;
  crop_type: string;
  season: string;
  location: string;
  region: string;
  land_area: number;
  land_area_unit: string;
  yield: number;
  revenue: number;
  confidence: number;
  date: string;
  formatted_date: string;
}

export default function HistoricalRecords() {
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    crop: '',
    season: '',
    location: '',
    region: '',
    startDate: '',
    endDate: '',
    minRevenue: '',
    maxRevenue: ''
  });

  const [crops, setCrops] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  const fetchRecords = async (appliedFilters: typeof filters = filters) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (appliedFilters.crop) params.append('crop', appliedFilters.crop);
      if (appliedFilters.season) params.append('season', appliedFilters.season);
      if (appliedFilters.location) params.append('location', appliedFilters.location);
      if (appliedFilters.region) params.append('region', appliedFilters.region);
      if (appliedFilters.startDate) params.append('start_date', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('end_date', appliedFilters.endDate);
      if (appliedFilters.minRevenue) params.append('min_revenue', appliedFilters.minRevenue);
      if (appliedFilters.maxRevenue) params.append('max_revenue', appliedFilters.maxRevenue);

      const response = await fetch(
        `http://localhost:5000/api/predictions/filters?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data.predictions);
        
        // Extract unique crops and regions
        const uniqueCrops = [...new Set(data.predictions.map((p: PredictionRecord) => p.crop_type))];
        const uniqueRegions = [...new Set(data.predictions.map((p: PredictionRecord) => p.region))];
        
        setCrops(uniqueCrops.filter(c => c) as string[]);
        setRegions(uniqueRegions.filter(r => r) as string[]);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    fetchRecords(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      crop: '',
      season: '',
      location: '',
      region: '',
      startDate: '',
      endDate: '',
      minRevenue: '',
      maxRevenue: ''
    };
    setFilters(emptyFilters);
    fetchRecords(emptyFilters);
  };

  const exportToExcel = () => {
    const data = records.map(r => ({
      'Crop': r.crop_type,
      'Season': r.season,
      'Location': r.location,
      'Region': r.region,
      'Land Area': `${r.land_area} ${r.land_area_unit}`,
      'Yield (Quintals)': r.yield,
      'Revenue (₹)': r.revenue,
      'Confidence': `${(r.confidence * 100).toFixed(0)}%`,
      'Date': r.formatted_date
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Predictions');
    XLSX.writeFile(wb, 'farming_predictions.xlsx');
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 10;

    // Title
    pdf.setFontSize(16);
    pdf.text('Farming Predictions Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Summary
    pdf.setFontSize(10);
    pdf.text(`Total Predictions: ${records.length}`, 10, yPosition);
    yPosition += 5;
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, yPosition);
    yPosition += 10;

    // Table
    pdf.setFontSize(9);
    const columns = ['Crop', 'Season', 'Location', 'Yield (Q)', 'Revenue (₹)', 'Date'];
    const rows = records.map(r => [
      r.crop_type,
      r.season,
      r.location,
      r.yield.toFixed(2),
      r.revenue.toFixed(0),
      r.formatted_date.split(',')[0]
    ]);

    let tableYPosition = yPosition;
    const rowHeight = 6;
    const colWidth = pageWidth / columns.length - 2;

    // Header
    pdf.setFillColor(34, 197, 94);
    pdf.setTextColor(255, 255, 255);
    columns.forEach((col, i) => {
      pdf.text(col, 10 + i * colWidth, tableYPosition, { maxWidth: colWidth - 1 });
    });
    tableYPosition += rowHeight;

    // Rows
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(240, 253, 244);
    rows.forEach((row, idx) => {
      if (tableYPosition > pageHeight - 20) {
        pdf.addPage();
        tableYPosition = 10;
      }

      row.forEach((cell, i) => {
        pdf.text(cell, 10 + i * colWidth, tableYPosition, { maxWidth: colWidth - 1 });
      });
      tableYPosition += rowHeight;

      if (idx % 2 === 0) {
        pdf.setFillColor(240, 253, 244);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
    });

    pdf.save('farming_predictions_report.pdf');
  };

  const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
  const avgYield = records.length > 0 ? records.reduce((sum, r) => sum + r.yield, 0) / records.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8" />
                <span>Historical Records & Analytics</span>
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={exportToExcel}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  onClick={exportToPDF}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Total Predictions</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{records.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Avg Yield</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {avgYield.toFixed(2)} Q
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">
                ₹{totalRevenue.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </CardHeader>

          {showFilters && (
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                  <select
                    value={filters.crop}
                    onChange={(e) => handleFilterChange('crop', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Crops</option>
                    {crops.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select
                    value={filters.season}
                    onChange={(e) => handleFilterChange('season', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Seasons</option>
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Search location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Revenue (₹)</label>
                  <input
                    type="number"
                    value={filters.minRevenue}
                    onChange={(e) => handleFilterChange('minRevenue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Revenue (₹)</label>
                  <input
                    type="number"
                    value={filters.maxRevenue}
                    onChange={(e) => handleFilterChange('maxRevenue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Clear All
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">No records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Crop</th>
                      <th className="px-4 py-3 text-left font-semibold">Season</th>
                      <th className="px-4 py-3 text-left font-semibold">Location</th>
                      <th className="px-4 py-3 text-right font-semibold">Land Area</th>
                      <th className="px-4 py-3 text-right font-semibold">Yield (Q)</th>
                      <th className="px-4 py-3 text-right font-semibold">Revenue (₹)</th>
                      <th className="px-4 py-3 text-center font-semibold">Confidence</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={record.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-semibold text-gray-800 capitalize">{record.crop_type}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-blue-50">
                            {record.season}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{record.location}</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {record.land_area} {record.land_area_unit}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">
                          {record.yield.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                          ₹{record.revenue.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            {(record.confidence * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {record.formatted_date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
