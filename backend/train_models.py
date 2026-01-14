"""
ML Model Training Script for Agricultural Predictions
Trains models for yield prediction, crop recommendation, and risk assessment
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report, confusion_matrix
import joblib
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

class YieldPredictor:
    """Train and save yield prediction model"""
    
    def __init__(self):
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5)
        self.scaler = StandardScaler()
        self.feature_names = ['rainfall', 'temperature', 'nitrogen', 'phosphorus', 'potassium', 'soil_moisture', 'humidity']
        
    def generate_training_data(self, samples=1000):
        """Generate synthetic training data for yield prediction"""
        np.random.seed(42)
        
        data = {
            'rainfall': np.random.uniform(600, 2000, samples),
            'temperature': np.random.uniform(15, 35, samples),
            'nitrogen': np.random.uniform(30, 150, samples),
            'phosphorus': np.random.uniform(15, 80, samples),
            'potassium': np.random.uniform(15, 80, samples),
            'soil_moisture': np.random.uniform(20, 80, samples),
            'humidity': np.random.uniform(40, 90, samples),
        }
        
        # Generate yield based on features (simulated relationship)
        yield_base = (
            (data['rainfall'] / 1000) * 2 +
            (data['temperature'] / 25) * 1.5 +
            (data['nitrogen'] / 100) * 0.8 +
            (data['phosphorus'] / 50) * 0.5 +
            (data['soil_moisture'] / 100) * 1.2
        )
        
        # Add noise
        yield_values = yield_base + np.random.normal(0, 0.3, samples)
        yield_values = np.clip(yield_values, 1.5, 8.0)  # Realistic range
        
        df = pd.DataFrame(data)
        df['yield'] = yield_values
        
        return df
    
    def train(self):
        """Train the yield prediction model"""
        print("=" * 50)
        print("YIELD PREDICTION MODEL TRAINING")
        print("=" * 50)
        
        # Generate training data
        df = self.generate_training_data(samples=2000)
        print(f"Generated {len(df)} training samples")
        print(f"Features: {self.feature_names}")
        print(f"Yield range: {df['yield'].min():.2f} - {df['yield'].max():.2f} tons/hectare\n")
        
        # Prepare data
        X = df[self.feature_names]
        y = df['yield']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples\n")
        
        # Train model
        print("Training Gradient Boosting Regressor...")
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Metrics
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        
        print(f"\nTraining Results:")
        print(f"  Train RMSE: {train_rmse:.4f}")
        print(f"  Test RMSE:  {test_rmse:.4f}")
        print(f"  Train R²:   {train_r2:.4f}")
        print(f"  Test R²:    {test_r2:.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X_scaled, y, cv=5, 
            scoring='r2'
        )
        print(f"  Cross-val R² (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Feature importance
        print(f"\nFeature Importance:")
        for feat, importance in zip(self.feature_names, self.model.feature_importances_):
            print(f"  {feat}: {importance:.4f}")
        
        # Save model
        joblib.dump(self.model, 'models/yield_model.pkl')
        joblib.dump(self.scaler, 'models/yield_scaler.pkl')
        print(f"\n✅ Model saved to models/yield_model.pkl")
        
        return {
            'test_rmse': test_rmse,
            'test_r2': test_r2,
            'cv_r2_mean': cv_scores.mean(),
            'cv_r2_std': cv_scores.std()
        }


class CropRecommender:
    """Train and save crop recommendation model"""
    
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = ['rainfall', 'temperature', 'soil_type_encoded', 'season_encoded', 'ph_level']
        self.crops = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean']
        
    def generate_training_data(self, samples=1500):
        """Generate synthetic training data for crop recommendation"""
        np.random.seed(42)
        
        # Define crop suitability
        crop_data = []
        
        for _ in range(samples):
            rainfall = np.random.uniform(600, 2000)
            temperature = np.random.uniform(15, 35)
            soil_type = np.random.choice([1, 2, 3, 4])  # clay, loam, sandy, laterite
            season = np.random.choice([1, 2, 3])  # kharif, rabi, summer
            ph_level = np.random.uniform(5.5, 8.0)
            
            # Determine best crop based on conditions
            if rainfall > 1500 and temperature > 25:
                best_crop = 'rice'
            elif rainfall < 800 and temperature < 25:
                best_crop = 'wheat'
            elif rainfall > 1000 and temperature > 20:
                best_crop = 'maize'
            elif rainfall > 1200 and season == 2:
                best_crop = 'sugarcane'
            elif rainfall < 900 and temperature > 25:
                best_crop = 'cotton'
            else:
                best_crop = 'soybean'
            
            crop_data.append({
                'rainfall': rainfall,
                'temperature': temperature,
                'soil_type': soil_type,
                'season': season,
                'ph_level': ph_level,
                'crop': best_crop
            })
        
        df = pd.DataFrame(crop_data)
        return df
    
    def train(self):
        """Train the crop recommendation model"""
        print("\n" + "=" * 50)
        print("CROP RECOMMENDATION MODEL TRAINING")
        print("=" * 50)
        
        # Generate training data
        df = self.generate_training_data(samples=2000)
        print(f"Generated {len(df)} training samples")
        print(f"Crops: {self.crops}")
        print(f"Crop distribution:\n{df['crop'].value_counts()}\n")
        
        # Prepare data
        X = df[['rainfall', 'temperature', 'soil_type', 'season', 'ph_level']]
        y = df['crop']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encode target
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples\n")
        
        # Train model
        print("Training Random Forest Classifier...")
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Metrics
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        print(f"\nTraining Results:")
        print(f"  Train Accuracy: {train_acc:.4f}")
        print(f"  Test Accuracy:  {test_acc:.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X_scaled, y_encoded, cv=5,
            scoring='accuracy'
        )
        print(f"  Cross-val Accuracy (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Classification report
        print(f"\nClassification Report:")
        y_test_labels = self.label_encoder.inverse_transform(y_test)
        y_pred_labels = self.label_encoder.inverse_transform(y_pred_test)
        print(classification_report(y_test_labels, y_pred_labels))
        
        # Feature importance
        feature_names_display = ['rainfall', 'temperature', 'soil_type', 'season', 'ph_level']
        print(f"Feature Importance:")
        for feat, importance in zip(feature_names_display, self.model.feature_importances_):
            print(f"  {feat}: {importance:.4f}")
        
        # Save model
        joblib.dump(self.model, 'models/crop_model.pkl')
        joblib.dump(self.scaler, 'models/crop_scaler.pkl')
        joblib.dump(self.label_encoder, 'models/crop_label_encoder.pkl')
        print(f"\n✅ Model saved to models/crop_model.pkl")
        
        return {
            'test_accuracy': test_acc,
            'cv_accuracy_mean': cv_scores.mean(),
            'cv_accuracy_std': cv_scores.std()
        }


class RiskPredictor:
    """Train and save enhanced disease/weather risk prediction model"""
    
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=150, random_state=42, max_depth=12, min_samples_split=5)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        # Enhanced feature set for comprehensive risk assessment
        self.feature_names = [
            'temperature', 'humidity', 'rainfall', 'crop_age', 'soil_moisture',
            'nitrogen', 'phosphorus', 'potassium', 'soil_ph', 'soil_drainage'
        ]
        
    def generate_training_data(self, samples=3000):
        """Generate synthetic training data for comprehensive risk prediction"""
        np.random.seed(42)
        
        risk_data = []
        
        for _ in range(samples):
            temperature = np.random.uniform(10, 40)
            humidity = np.random.uniform(20, 100)
            rainfall = np.random.uniform(0, 250)
            crop_age = np.random.uniform(0, 150)
            soil_moisture = np.random.uniform(10, 85)
            nitrogen = np.random.uniform(20, 150)
            phosphorus = np.random.uniform(10, 80)
            potassium = np.random.uniform(10, 100)
            soil_ph = np.random.uniform(4.5, 8.5)
            soil_drainage = np.random.uniform(20, 100)  # 20=poor, 100=excellent
            
            # Determine risk level based on multiple factors
            risk_score = 0
            
            # Weather-based risks
            # High humidity + high temperature + moderate crop age = HIGH disease risk
            if humidity > 85 and temperature > 28 and 30 < crop_age < 90:
                risk_score += 35
            elif humidity > 75 and temperature > 26:
                risk_score += 20
            elif humidity > 65 and temperature > 30:
                risk_score += 15
            
            # Rainfall extremes (drought or flood)
            if rainfall < 30:  # Drought risk
                risk_score += 25
                if nitrogen < 50:  # Poor nutrients worsen drought
                    risk_score += 10
            elif rainfall > 180:  # Flood risk
                risk_score += 30
                if soil_drainage < 50:  # Poor drainage worsens flood
                    risk_score += 15
            
            # Nutrient deficiencies increase vulnerability
            if nitrogen < 40:
                risk_score += 15
            if potassium < 30:  # K is critical for stress tolerance
                risk_score += 20
            if phosphorus < 25:
                risk_score += 10
            
            # Soil pH extremes
            if soil_ph < 5.0 or soil_ph > 8.2:
                risk_score += 15
            elif soil_ph < 5.5 or soil_ph > 7.8:
                risk_score += 8
            
            # Poor soil conditions
            if soil_moisture < 20:
                risk_score += 15
            elif soil_moisture > 80:
                risk_score += 12
            
            if soil_drainage < 40:
                risk_score += 20
            
            # Critical crop growth stages are more vulnerable
            if 40 < crop_age < 70:  # Flowering stage
                risk_score += 15
            elif 70 < crop_age < 110:  # Fruit/grain development
                risk_score += 10
            
            # Environmental stress combinations
            if temperature > 35 and humidity < 40:  # Heat + dry = severe stress
                risk_score += 20
            
            # Add realistic noise
            risk_score += np.random.normal(0, 8)
            risk_score = np.clip(risk_score, 0, 100)
            
            # Categorize risk with better distribution
            if risk_score > 75:
                risk_level = 'high'
            elif risk_score > 45:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            risk_data.append({
                'temperature': temperature,
                'humidity': humidity,
                'rainfall': rainfall,
                'crop_age': crop_age,
                'soil_moisture': soil_moisture,
                'nitrogen': nitrogen,
                'phosphorus': phosphorus,
                'potassium': potassium,
                'soil_ph': soil_ph,
                'soil_drainage': soil_drainage,
                'risk_level': risk_level,
                'risk_score': risk_score
            })
        
        df = pd.DataFrame(risk_data)
        return df
    
    def train(self):
        """Train the enhanced risk prediction model"""
        print("\n" + "=" * 50)
        print("ENHANCED RISK PREDICTION MODEL TRAINING")
        print("=" * 50)
        
        # Generate training data with expanded feature set
        df = self.generate_training_data(samples=3000)
        print(f"Generated {len(df)} training samples")
        print(f"Risk distribution:\n{df['risk_level'].value_counts()}\n")
        
        # Prepare data
        X = df[self.feature_names]
        y = df['risk_level']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encode target
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Train-test split with stratification for balanced evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples\n")
        
        # Train model
        print("Training Enhanced Random Forest Classifier...")
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Metrics
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        print(f"\nTraining Results:")
        print(f"  Train Accuracy: {train_acc:.4f}")
        print(f"  Test Accuracy:  {test_acc:.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X_scaled, y_encoded, cv=5,

            scoring='accuracy'
        )
        print(f"  Cross-val Accuracy (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Classification report
        print(f"\nClassification Report:")
        y_test_labels = self.label_encoder.inverse_transform(y_test)
        y_pred_labels = self.label_encoder.inverse_transform(y_pred_test)
        print(classification_report(y_test_labels, y_pred_labels))
        
        # Feature importance
        print(f"Feature Importance:")
        for feat, importance in zip(self.feature_names, self.model.feature_importances_):
            print(f"  {feat}: {importance:.4f}")
        
        # Save model
        joblib.dump(self.model, 'models/risk_model.pkl')
        joblib.dump(self.scaler, 'models/risk_scaler.pkl')
        joblib.dump(self.label_encoder, 'models/risk_label_encoder.pkl')
        print(f"\n✅ Model saved to models/risk_model.pkl")
        
        return {
            'test_accuracy': test_acc,
            'cv_accuracy_mean': cv_scores.mean(),
            'cv_accuracy_std': cv_scores.std()
        }


def main():
    """Train all models"""
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║   NEUROVIA ML MODEL TRAINING PIPELINE                  ║")
    print("║   Training Yield, Crop, and Risk Prediction Models     ║")
    print("╚════════════════════════════════════════════════════════╝")
    
    results = {}
    
    # Train Yield Model
    yield_predictor = YieldPredictor()
    results['yield'] = yield_predictor.train()
    
    # Train Crop Recommendation Model
    crop_recommender = CropRecommender()
    results['crop'] = crop_recommender.train()
    
    # Train Risk Prediction Model
    risk_predictor = RiskPredictor()
    results['risk'] = risk_predictor.train()
    
    # Summary
    print("\n" + "=" * 50)
    print("TRAINING SUMMARY")
    print("=" * 50)
    print(f"\n✅ Yield Model - Test R²: {results['yield']['test_r2']:.4f}")
    print(f"✅ Crop Model - Test Accuracy: {results['crop']['test_accuracy']:.4f}")
    print(f"✅ Risk Model - Test Accuracy: {results['risk']['test_accuracy']:.4f}")
    
    print(f"\n📁 All models saved to models/ directory")
    print(f"⏰ Training completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n")


if __name__ == '__main__':
    main()
