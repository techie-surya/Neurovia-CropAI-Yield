/**
 * Mock ML Models for AgroAI Platform
 * Simulates Random Forest, XGBoost, and Classification algorithms
 * These functions generate realistic predictions based on agricultural science
 */

// Crop database with optimal growing conditions
export const CROP_DATABASE = {
  rice: { 
    optimalN: 80, optimalP: 40, optimalK: 40, optimalPH: 6.5, 
    optimalRainfall: 1200, optimalTemp: 28, baseYield: 4500,
    waterReq: 'High', fertilizerReq: 'Medium'
  },
  wheat: { 
    optimalN: 100, optimalP: 50, optimalK: 30, optimalPH: 6.8, 
    optimalRainfall: 450, optimalTemp: 22, baseYield: 3200,
    waterReq: 'Medium', fertilizerReq: 'High'
  },
  corn: { 
    optimalN: 120, optimalP: 60, optimalK: 50, optimalPH: 6.2, 
    optimalRainfall: 600, optimalTemp: 25, baseYield: 5500,
    waterReq: 'Medium', fertilizerReq: 'High'
  },
  cotton: { 
    optimalN: 90, optimalP: 45, optimalK: 35, optimalPH: 7.0, 
    optimalRainfall: 700, optimalTemp: 30, baseYield: 2800,
    waterReq: 'Low', fertilizerReq: 'Medium'
  },
  sugarcane: { 
    optimalN: 150, optimalP: 70, optimalK: 80, optimalPH: 6.5, 
    optimalRainfall: 1500, optimalTemp: 32, baseYield: 70000,
    waterReq: 'High', fertilizerReq: 'High'
  },
  soybean: { 
    optimalN: 40, optimalP: 35, optimalK: 45, optimalPH: 6.5, 
    optimalRainfall: 500, optimalTemp: 26, baseYield: 2800,
    waterReq: 'Medium', fertilizerReq: 'Low'
  },
  potato: { 
    optimalN: 110, optimalP: 55, optimalK: 60, optimalPH: 5.8, 
    optimalRainfall: 550, optimalTemp: 20, baseYield: 25000,
    waterReq: 'Medium', fertilizerReq: 'High'
  },
  tomato: { 
    optimalN: 100, optimalP: 50, optimalK: 70, optimalPH: 6.3, 
    optimalRainfall: 600, optimalTemp: 24, baseYield: 35000,
    waterReq: 'Medium', fertilizerReq: 'Medium'
  }
};

export type CropName = keyof typeof CROP_DATABASE;

export interface PredictionInput {
  crop: CropName;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilType: string;
  soilColor: string;
  waterlogging: string;
  phCategory: string; // "Acidic", "Neutral", or "Alkaline"
  rainfall: number;
  temperature: number;
}

export interface YieldPrediction {
  predictedYield: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  confidence: number;
  factors: {
    soilHealth: number;
    weatherSuitability: number;
    nutrientBalance: number;
  };
}

/**
 * Estimates soil pH category based on soil type, color, and waterlogging tendency
 * Returns: "Acidic", "Neutral", or "Alkaline"
 */
export function estimateSoilPH(soilType: string, soilColor: string, waterlogging: string): string {
  let score = 0;

  // Soil Type contribution
  switch (soilType) {
    case 'Clay':
      score += 1; // Tends neutral to slightly alkaline
      break;
    case 'Loam':
      score += 0; // Neutral
      break;
    case 'Sandy':
      score -= 1; // Tends acidic
      break;
    case 'Silty':
      score += 0; // Neutral
      break;
    case 'Peaty':
      score -= 2; // Highly acidic
      break;
    case 'Chalky':
      score += 2; // Alkaline
      break;
  }

  // Soil Color contribution
  switch (soilColor) {
    case 'Dark Brown/Black':
      score -= 1; // High organic matter = acidic
      break;
    case 'Red':
      score -= 1; // Iron-rich, often acidic
      break;
    case 'Yellow':
      score += 0; // Variable
      break;
    case 'Light Brown':
      score += 1; // Often alkaline or neutral
      break;
  }

  // Waterlogging contribution
  switch (waterlogging) {
    case 'Yes':
      score -= 1; // Poor drainage = more acidic
      break;
    case 'No':
      score += 0; // Neutral
      break;
    case 'Occasional':
      score -= 0.5; // Slightly acidic
      break;
  }

  // Convert score to category
  if (score <= -1) return 'Acidic';
  if (score >= 1) return 'Alkaline';
  return 'Neutral';
}

/**
 * Simulates Random Forest Yield Prediction Model
 * Uses weighted scoring based on deviation from optimal conditions
 */
export function predictCropYield(input: PredictionInput): YieldPrediction {
  const optimal = CROP_DATABASE[input.crop];
  
  // Convert pH category to numeric value for calculations
  const phNumeric = input.phCategory === 'Acidic' ? 5.5 : 
                     input.phCategory === 'Alkaline' ? 8.0 : 6.5;
  
  // Calculate deviation scores (0-100, where 100 is optimal)
  const nScore = calculateNutrientScore(input.nitrogen, optimal.optimalN);
  const pScore = calculateNutrientScore(input.phosphorus, optimal.optimalP);
  const kScore = calculateNutrientScore(input.potassium, optimal.optimalK);
  const phScore = calculatePHScore(phNumeric, optimal.optimalPH);
  const rainfallScore = calculateRainfallScore(input.rainfall, optimal.optimalRainfall);
  const tempScore = calculateTempScore(input.temperature, optimal.optimalTemp);
  
  // Weighted average (simulating Random Forest feature importance)
  const soilHealth = (nScore * 0.35 + pScore * 0.30 + kScore * 0.25 + phScore * 0.10) / 100;
  const weatherSuitability = (rainfallScore * 0.55 + tempScore * 0.45) / 100;
  const nutrientBalance = (nScore + pScore + kScore) / 300;
  
  // Overall yield multiplier
  const yieldMultiplier = (soilHealth * 0.45 + weatherSuitability * 0.35 + nutrientBalance * 0.20);
  
  // Add some realistic variance (simulating model uncertainty)
  const variance = 0.85 + Math.random() * 0.15; // 85-100% of calculated
  const predictedYield = Math.round(optimal.baseYield * yieldMultiplier * variance);
  
  // Risk calculation based on extreme conditions
  const riskScore = calculateRiskScore(input, optimal);
  const riskLevel = riskScore > 60 ? 'High' : riskScore > 30 ? 'Medium' : 'Low';
  
  // Confidence based on how close to optimal conditions
  const confidence = Math.round((yieldMultiplier * 85 + 15) * 100) / 100;
  
  return {
    predictedYield,
    riskLevel,
    riskScore,
    confidence,
    factors: {
      soilHealth: Math.round(soilHealth * 100),
      weatherSuitability: Math.round(weatherSuitability * 100),
      nutrientBalance: Math.round(nutrientBalance * 100)
    }
  };
}

/**
 * Nutrient score: 100 at optimal, decreases with deviation
 */
function calculateNutrientScore(actual: number, optimal: number): number {
  const deviation = Math.abs(actual - optimal) / optimal;
  if (deviation > 1) return 20; // Severely deficient or excessive
  return Math.max(20, 100 - (deviation * 80));
}

/**
 * pH score: Critical for nutrient availability
 */
function calculatePHScore(actual: number, optimal: number): number {
  const deviation = Math.abs(actual - optimal);
  if (deviation > 1.5) return 30;
  if (deviation > 1.0) return 50;
  if (deviation > 0.5) return 70;
  return 90;
}

/**
 * Rainfall score: Too little = drought, too much = flooding
 */
function calculateRainfallScore(actual: number, optimal: number): number {
  const ratio = actual / optimal;
  if (ratio < 0.5 || ratio > 1.8) return 25; // Extreme conditions
  if (ratio < 0.7 || ratio > 1.5) return 50; // Challenging
  if (ratio < 0.85 || ratio > 1.15) return 75; // Manageable
  return 95; // Optimal
}

/**
 * Temperature score: Each crop has specific temp requirements
 */
function calculateTempScore(actual: number, optimal: number): number {
  const deviation = Math.abs(actual - optimal);
  if (deviation > 10) return 30; // Heat/cold stress
  if (deviation > 6) return 60;
  if (deviation > 3) return 80;
  return 95;
}

/**
 * Risk score calculation (Logistic Regression simulation)
 */
function calculateRiskScore(input: PredictionInput, optimal: any): number {
  let risk = 0;
  
  // Drought risk
  if (input.rainfall < optimal.optimalRainfall * 0.6) risk += 30;
  
  // Flood risk
  if (input.rainfall > optimal.optimalRainfall * 1.6) risk += 25;
  
  // Heat stress risk
  if (input.temperature > optimal.optimalTemp + 8) risk += 20;
  
  // Cold stress risk
  if (input.temperature < optimal.optimalTemp - 8) risk += 20;
  
  // Soil acidity/alkalinity risk
  const phNumeric = input.phCategory === 'Acidic' ? 5.5 : 
                     input.phCategory === 'Alkaline' ? 8.0 : 6.5;
  if (Math.abs(phNumeric - optimal.optimalPH) > 1) risk += 15;
  
  // Nutrient deficiency risk
  const nDeficit = (optimal.optimalN - input.nitrogen) / optimal.optimalN;
  if (nDeficit > 0.4) risk += 15;
  
  return Math.min(100, risk);
}

/**
 * Smart Crop Recommendation System (Classification Model)
 * Returns top 3 crops suitable for given soil and weather
 */
export interface CropRecommendation {
  crop: CropName;
  suitabilityScore: number;
  expectedYield: number;
  reason: string;
}

export function recommendCrops(
  nitrogen: number,
  phosphorus: number,
  potassium: number,
  phCategory: string,
  rainfall: number,
  temperature: number
): CropRecommendation[] {
  const recommendations: CropRecommendation[] = [];
  
  // Score each crop
  for (const [cropName, optimal] of Object.entries(CROP_DATABASE)) {
    const input: PredictionInput = {
      crop: cropName as CropName,
      nitrogen,
      phosphorus,
      potassium,
      soilType: 'Loam', // Default values for recommendation
      soilColor: 'Dark Brown/Black',
      waterlogging: 'No',
      phCategory,
      rainfall,
      temperature
    };
    
    const prediction = predictCropYield(input);
    const suitabilityScore = 
      (prediction.factors.soilHealth * 0.4 +
       prediction.factors.weatherSuitability * 0.4 +
       prediction.factors.nutrientBalance * 0.2);
    
    // Generate reason based on dominant factor
    let reason = '';
    if (prediction.factors.soilHealth > 75) {
      reason = 'Excellent soil nutrient match';
    } else if (prediction.factors.weatherSuitability > 75) {
      reason = 'Ideal climate conditions';
    } else if (suitabilityScore > 60) {
      reason = 'Good overall compatibility';
    } else {
      reason = 'Moderate suitability';
    }
    
    recommendations.push({
      crop: cropName as CropName,
      suitabilityScore: Math.round(suitabilityScore),
      expectedYield: prediction.predictedYield,
      reason
    });
  }
  
  // Sort by suitability and return top 3
  return recommendations
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 3);
}

/**
 * Fertilizer Optimization Recommendation
 */
export interface FertilizerRecommendation {
  nitrogenNeeded: number;
  phosphorusNeeded: number;
  potassiumNeeded: number;
  totalFertilizer: number;
  estimatedCost: number;
  yieldImprovement: number;
  explanation: string;
}

export function optimizeFertilizer(input: PredictionInput): FertilizerRecommendation {
  const optimal = CROP_DATABASE[input.crop];
  
  // Calculate deficits (kg/hectare)
  const nDeficit = Math.max(0, optimal.optimalN - input.nitrogen);
  const pDeficit = Math.max(0, optimal.optimalP - input.phosphorus);
  const kDeficit = Math.max(0, optimal.optimalK - input.potassium);
  
  const totalFertilizer = nDeficit + pDeficit + kDeficit;
  
  // Estimate cost (₹15 per kg average)
  const estimatedCost = Math.round(totalFertilizer * 15);
  
  // Calculate current vs optimized yield
  const currentPrediction = predictCropYield(input);
  const optimizedInput = {
    ...input,
    nitrogen: optimal.optimalN,
    phosphorus: optimal.optimalP,
    potassium: optimal.optimalK
  };
  const optimizedPrediction = predictCropYield(optimizedInput);
  
  const yieldImprovement = Math.round(
    ((optimizedPrediction.predictedYield - currentPrediction.predictedYield) / 
     currentPrediction.predictedYield) * 100
  );
  
  let explanation = '';
  if (totalFertilizer === 0) {
    explanation = 'Soil nutrients are optimal. No additional fertilizer needed.';
  } else if (nDeficit > 20) {
    explanation = 'Nitrogen deficiency detected. Apply urea to boost vegetative growth.';
  } else if (pDeficit > 15) {
    explanation = 'Phosphorus needed for root development and flowering.';
  } else {
    explanation = 'Balanced fertilizer application recommended for optimal yield.';
  }
  
  return {
    nitrogenNeeded: Math.round(nDeficit),
    phosphorusNeeded: Math.round(pDeficit),
    potassiumNeeded: Math.round(kDeficit),
    totalFertilizer: Math.round(totalFertilizer),
    estimatedCost,
    yieldImprovement,
    explanation
  };
}

/**
 * Irrigation Optimization
 */
export interface IrrigationRecommendation {
  frequency: string;
  waterPerWeek: number; // liters per hectare
  method: string;
  explanation: string;
}

export function optimizeIrrigation(input: PredictionInput): IrrigationRecommendation {
  const optimal = CROP_DATABASE[input.crop];
  const rainfallDeficit = optimal.optimalRainfall - input.rainfall;
  
  let frequency = '';
  let waterPerWeek = 0;
  let method = '';
  let explanation = '';
  
  if (rainfallDeficit <= 0) {
    frequency = 'Minimal - rainfall sufficient';
    waterPerWeek = Math.max(0, Math.round(rainfallDeficit * -0.5));
    method = 'Natural rainfall';
    explanation = 'Rainfall is adequate. Monitor soil moisture and irrigate only if dry spells occur.';
  } else if (rainfallDeficit < 300) {
    frequency = '1-2 times per week';
    waterPerWeek = Math.round(rainfallDeficit * 1.2);
    method = 'Drip irrigation';
    explanation = 'Moderate irrigation needed. Drip system saves 40% water vs flood irrigation.';
  } else if (rainfallDeficit < 600) {
    frequency = '3-4 times per week';
    waterPerWeek = Math.round(rainfallDeficit * 1.5);
    method = optimal.waterReq === 'High' ? 'Flood irrigation' : 'Sprinkler system';
    explanation = 'Regular irrigation critical. Consider mulching to retain soil moisture.';
  } else {
    frequency = 'Daily or alternate day';
    waterPerWeek = Math.round(rainfallDeficit * 2);
    method = 'Drip irrigation + mulching';
    explanation = 'High water requirement. Implement water conservation techniques urgently.';
  }
  
  return {
    frequency,
    waterPerWeek,
    method,
    explanation
  };
}

/**
 * Weather Risk Prediction
 */
export interface WeatherRisk {
  droughtRisk: 'Low' | 'Medium' | 'High';
  floodRisk: 'Low' | 'Medium' | 'High';
  heatStressRisk: 'Low' | 'Medium' | 'High';
  overallAlert: string;
  recommendations: string[];
}

export function predictWeatherRisk(input: PredictionInput): WeatherRisk {
  const optimal = CROP_DATABASE[input.crop];
  const recommendations: string[] = [];
  
  // Drought risk
  const rainfallRatio = input.rainfall / optimal.optimalRainfall;
  let droughtRisk: 'Low' | 'Medium' | 'High' = 'Low';
  if (rainfallRatio < 0.5) {
    droughtRisk = 'High';
    recommendations.push('Install drip irrigation system immediately');
    recommendations.push('Apply mulch to conserve soil moisture');
  } else if (rainfallRatio < 0.7) {
    droughtRisk = 'Medium';
    recommendations.push('Ensure backup water source is available');
  }
  
  // Flood risk
  let floodRisk: 'Low' | 'Medium' | 'High' = 'Low';
  if (rainfallRatio > 1.6) {
    floodRisk = 'High';
    recommendations.push('Improve field drainage systems');
    recommendations.push('Consider raised bed cultivation');
  } else if (rainfallRatio > 1.3) {
    floodRisk = 'Medium';
    recommendations.push('Monitor field drainage during heavy rains');
  }
  
  // Heat stress risk
  const tempDiff = input.temperature - optimal.optimalTemp;
  let heatStressRisk: 'Low' | 'Medium' | 'High' = 'Low';
  if (tempDiff > 8) {
    heatStressRisk = 'High';
    recommendations.push('Increase irrigation frequency during hot days');
    recommendations.push('Consider shade nets for sensitive crops');
  } else if (tempDiff > 5) {
    heatStressRisk = 'Medium';
    recommendations.push('Monitor crop for heat stress symptoms');
  }
  
  // Overall alert
  let overallAlert = '✓ Favorable conditions expected';
  const highRisks = [droughtRisk, floodRisk, heatStressRisk].filter(r => r === 'High').length;
  if (highRisks >= 2) {
    overallAlert = '⚠️ CRITICAL: Multiple severe weather risks detected!';
  } else if (highRisks === 1) {
    overallAlert = '⚠️ WARNING: Significant weather risk - take action';
  } else if (droughtRisk === 'Medium' || floodRisk === 'Medium' || heatStressRisk === 'Medium') {
    overallAlert = '⚡ CAUTION: Monitor weather conditions closely';
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue with standard farming practices');
    recommendations.push('Monitor weather forecasts regularly');
  }
  
  return {
    droughtRisk,
    floodRisk,
    heatStressRisk,
    overallAlert,
    recommendations
  };
}

/**
 * Feature Importance for Explainable AI
 */
export interface FeatureImportance {
  feature: string;
  importance: number;
  impact: string;
  recommendation: string;
}

export function calculateFeatureImportance(input: PredictionInput): FeatureImportance[] {
  const optimal = CROP_DATABASE[input.crop];
  const features: FeatureImportance[] = [];
  
  // Calculate each feature's impact
  const nScore = calculateNutrientScore(input.nitrogen, optimal.optimalN);
  const pScore = calculateNutrientScore(input.phosphorus, optimal.optimalP);
  const kScore = calculateNutrientScore(input.potassium, optimal.optimalK);
  const rainfallScore = calculateRainfallScore(input.rainfall, optimal.optimalRainfall);
  const tempScore = calculateTempScore(input.temperature, optimal.optimalTemp);
  const phNumeric = input.phCategory === 'Acidic' ? 5.5 : 
                     input.phCategory === 'Alkaline' ? 8.0 : 6.5;
  const phScore = calculatePHScore(phNumeric, optimal.optimalPH);
  
  features.push({
    feature: 'Nitrogen (N)',
    importance: Math.round((100 - nScore) * 0.35),
    impact: nScore > 70 ? 'Positive' : nScore > 50 ? 'Moderate' : 'Negative',
    recommendation: nScore < 70 ? 'Apply nitrogen-rich fertilizers (Urea)' : 'Nitrogen levels are good'
  });
  
  features.push({
    feature: 'Rainfall',
    importance: Math.round((100 - rainfallScore) * 0.30),
    impact: rainfallScore > 70 ? 'Positive' : rainfallScore > 50 ? 'Moderate' : 'Negative',
    recommendation: rainfallScore < 70 ? 'Increase irrigation frequency' : 'Rainfall is adequate'
  });
  
  features.push({
    feature: 'Phosphorus (P)',
    importance: Math.round((100 - pScore) * 0.25),
    impact: pScore > 70 ? 'Positive' : pScore > 50 ? 'Moderate' : 'Negative',
    recommendation: pScore < 70 ? 'Add phosphate fertilizers (DAP)' : 'Phosphorus levels are good'
  });
  
  features.push({
    feature: 'Temperature',
    importance: Math.round((100 - tempScore) * 0.20),
    impact: tempScore > 70 ? 'Positive' : tempScore > 50 ? 'Moderate' : 'Negative',
    recommendation: tempScore < 70 ? 'Adjust planting season for better temps' : 'Temperature is suitable'
  });
  
  features.push({
    feature: 'Potassium (K)',
    importance: Math.round((100 - kScore) * 0.15),
    impact: kScore > 70 ? 'Positive' : kScore > 50 ? 'Moderate' : 'Negative',
    recommendation: kScore < 70 ? 'Apply potash fertilizers (MOP)' : 'Potassium levels are good'
  });
  
  features.push({
    feature: 'Soil pH',
    importance: Math.round((100 - phScore) * 0.10),
    impact: phScore > 70 ? 'Positive' : phScore > 50 ? 'Moderate' : 'Negative',
    recommendation: phScore < 70 ? 'Adjust soil pH with lime or sulfur' : 'pH is in optimal range'
  });
  
  return features.sort((a, b) => b.importance - a.importance);
}
