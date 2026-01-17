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
  let riskScore = 0; // 0-100 scale
  
  // Get pH numeric value
  const phMap: Record<string, number> = {
    'Strongly Acidic': 5.0, 'Acidic': 5.5, 'Slightly Acidic': 6.0,
    'Neutral': 7.0, 'Slightly Alkaline': 7.5, 'Alkaline': 8.0, 'Strongly Alkaline': 8.5
  };
  const phValue = phMap[input.phCategory] || 7.0;
  
  // ===== DROUGHT RISK ASSESSMENT =====
  const rainfallRatio = input.rainfall / optimal.optimalRainfall;
  let droughtRisk: 'Low' | 'Medium' | 'High' = 'Low';
  
  // More sensitive drought detection (starts at 60% instead of 50%)
  if (rainfallRatio < 0.5) {
    droughtRisk = 'High';
    riskScore += 35;
    recommendations.push('🚨 CRITICAL: Install drip irrigation immediately');
    recommendations.push('Apply 5-8cm organic mulch to reduce evaporation');
    recommendations.push('Plant drought-resistant crop varieties if possible');
    recommendations.push('Increase irrigation frequency significantly');
  } else if (rainfallRatio < 0.7) {
    droughtRisk = 'Medium';
    riskScore += 20;
    recommendations.push('⚠️ Drought risk detected - ensure reliable irrigation backup');
    recommendations.push('Increase mulching to conserve soil moisture');
    recommendations.push('Monitor soil moisture levels closely');
  } else if (rainfallRatio < 0.9) {
    droughtRisk = 'Low';
    riskScore += 8;
    recommendations.push('Monitor soil moisture and rainfall patterns');
  }
  
  // ===== FLOOD RISK ASSESSMENT =====
  let floodRisk: 'Low' | 'Medium' | 'High' = 'Low';
  let soilDrainageScore = 80; // Start with good drainage
  
  // Check soil type drainage
  switch (input.soilType) {
    case 'Clay':
      soilDrainageScore = 40; // Poor drainage
      break;
    case 'Peaty':
      soilDrainageScore = 30; // Very poor drainage
      break;
    case 'Silty':
      soilDrainageScore = 60; // Moderate drainage
      break;
    case 'Sandy':
      soilDrainageScore = 95; // Excellent drainage
      break;
    default: // Loam
      soilDrainageScore = 75;
  }
  
  // Check waterlogging tendency
  if (input.waterlogging === 'Yes') {
    soilDrainageScore -= 30;
  } else if (input.waterlogging === 'Occasional') {
    soilDrainageScore -= 15;
  }
  
  // More sensitive flood risk detection
  if (rainfallRatio > 1.8) {
    // 180% of optimal - severe excess rainfall
    if (soilDrainageScore < 50) {
      floodRisk = 'High';
      riskScore += 40;
      recommendations.push('🚨 CRITICAL: Establish raised bed or ridge-furrow system');
      recommendations.push('Build field bunds and improve drainage channels immediately');
      recommendations.push('Prepare for potential waterlogging and root rot');
    } else if (soilDrainageScore < 85) {
      // Loam (75) falls here - it's still vulnerable at 180%+ rainfall
      floodRisk = 'High';
      riskScore += 35;
      recommendations.push('🚨 HIGH RISK: Very heavy rainfall detected - enhance drainage');
      recommendations.push('Monitor field water levels closely');
      recommendations.push('Prepare for possible waterlogging in low areas');
    } else {
      // Only excellent drainage (Sandy, 95) avoids High at extreme rainfall
      floodRisk = 'Medium';
      riskScore += 20;
      recommendations.push('⚠️ Monitor drainage during heavy rainfall');
      recommendations.push('Ensure drainage channels are clear');
    }
  } else if (rainfallRatio > 1.4) {
    // 140% of optimal - moderate excess rainfall
    if (soilDrainageScore < 50) {
      floodRisk = 'High';
      riskScore += 35;
      recommendations.push('🚨 URGENT: Improve drainage systems immediately');
      recommendations.push('Check and clear all drainage channels');
      recommendations.push('Monitor field water levels daily');
    } else if (soilDrainageScore < 75) {
      floodRisk = 'Medium';
      riskScore += 20;
      recommendations.push('⚠️ Enhance field drainage before heavy rains');
      recommendations.push('Monitor rainfall forecasts');
    } else {
      floodRisk = 'Low';
      riskScore += 5;
      recommendations.push('Maintain drainage channels regularly');
    }
  } else if (rainfallRatio > 1.1) {
    // 110% of optimal - slight excess rainfall
    if (soilDrainageScore < 55) {
      floodRisk = 'Medium';
      riskScore += 10;
      recommendations.push('Monitor field drainage during heavy rains');
      recommendations.push('Maintain clear drainage channels');
    }
  }
  
  // ===== HEAT STRESS RISK ASSESSMENT =====
  const tempDiff = input.temperature - optimal.optimalTemp;
  let heatStressRisk: 'Low' | 'Medium' | 'High' = 'Low';
  let nutrientStressScore = 0;
  
  // Calculate nutrient deficit impact on heat tolerance
  const nRatio = input.nitrogen / optimal.optimalN;
  const pRatio = input.phosphorus / optimal.optimalP;
  const kRatio = input.potassium / optimal.optimalK;
  
  // Poor nutrients reduce heat tolerance
  if (nRatio < 0.5) nutrientStressScore += 15;
  else if (nRatio < 0.7) nutrientStressScore += 8;
  
  if (pRatio < 0.5) nutrientStressScore += 10;
  else if (pRatio < 0.7) nutrientStressScore += 5;
  
  if (kRatio < 0.5) nutrientStressScore += 15; // K is critical for heat stress
  else if (kRatio < 0.7) nutrientStressScore += 10;
  
  // Temperature impact
  if (tempDiff > 12) {
    heatStressRisk = 'High';
    riskScore += 30;
    recommendations.push('🚨 HIGH HEAT: Increase irrigation frequency to 2-3 times daily');
    recommendations.push('Consider shade cloth or intercropping for temperature control');
    recommendations.push('Ensure adequate potassium levels (>60% optimal)');
  } else if (tempDiff > 8) {
    heatStressRisk = 'High';
    riskScore += 25 + nutrientStressScore;
    recommendations.push('Increase irrigation frequency to daily watering');
    recommendations.push('Apply potassium fertilizer (helps heat tolerance)');
    recommendations.push('Monitor for heat stress symptoms (leaf wilting, color change)');
  } else if (tempDiff > 5) {
    heatStressRisk = 'Medium';
    riskScore += 12 + (nutrientStressScore / 2);
    recommendations.push('Monitor crop for heat stress symptoms');
    recommendations.push('Ensure adequate potassium supply');
  } else if (tempDiff > 2) {
    riskScore += 3;
  }
  
  // ===== SOIL HEALTH & pH RISK =====
  const phOptimal = optimal.optimalPH;
  const phDiff = Math.abs(phValue - phOptimal);
  
  if (phDiff > 1.5) {
    riskScore += 15;
    if (phValue < phOptimal) {
      recommendations.push('Soil is too acidic - apply lime (CaCO₃) to raise pH');
    } else {
      recommendations.push('Soil is too alkaline - add sulfur or organic matter to lower pH');
    }
  } else if (phDiff > 0.8) {
    riskScore += 7;
    recommendations.push('Soil pH is slightly suboptimal - monitor nutrient availability');
  }
  
  // ===== NUTRIENT DEFICIENCY RISK =====
  let nutrientRisk = 0;
  if (nRatio < 0.6) nutrientRisk += 10;
  if (pRatio < 0.6) nutrientRisk += 8;
  if (kRatio < 0.6) nutrientRisk += 12;
  
  if (nutrientRisk > 20) {
    riskScore += 15;
    recommendations.push('Critical nutrient deficiency detected - apply fertilizer immediately');
  } else if (nutrientRisk > 10) {
    riskScore += 8;
    recommendations.push('Nutrients are below optimal - consider split fertilizer application');
  }
  
  // ===== NORMALIZE RISK SCORE =====
  riskScore = Math.min(100, riskScore);
  
  // ===== GENERATE OVERALL ALERT =====
  let overallAlert = '✓ Favorable conditions expected';
  const highRisks = [droughtRisk, floodRisk, heatStressRisk].filter(r => r === 'High').length;
  const mediumRisks = [droughtRisk, floodRisk, heatStressRisk].filter(r => r === 'Medium').length;
  
  if (riskScore >= 85 || highRisks >= 2) {
    overallAlert = '🚨 CRITICAL: Multiple severe risks - immediate intervention needed!';
  } else if (riskScore >= 70 || highRisks === 1) {
    overallAlert = '⚠️ WARNING: Significant weather/soil risks - take immediate action';
  } else if (riskScore >= 50 || mediumRisks >= 2) {
    overallAlert = '⚡ CAUTION: Monitor weather and field conditions closely';
  } else if (riskScore >= 30 || mediumRisks === 1) {
    overallAlert = '🌤️ Monitor: Some factors suboptimal - stay alert';
  }
  
  // Ensure recommendations list is not empty
  if (recommendations.length === 0) {
    recommendations.push('✅ Continue with standard farming practices');
    recommendations.push('📊 Monitor weather forecasts regularly');
    recommendations.push('📝 Keep field records for future planning');
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
  
  return features.sort((a, b) => b.importance - a.importance);
}
