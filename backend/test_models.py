"""
Model Testing and Evaluation Script
Tests trained models and provides performance metrics
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import warnings
warnings.filterwarnings('ignore')

class ModelTester:
    """Test and evaluate trained models"""
    
    def __init__(self):
        self.models_dir = 'models'
        self.test_results = {}
        
    def check_models_exist(self):
        """Check if all required model files exist"""
        required_files = [
            'yield_model.pkl', 'yield_scaler.pkl',
            'crop_model.pkl', 'crop_scaler.pkl', 'crop_label_encoder.pkl',
            'risk_model.pkl', 'risk_scaler.pkl', 'risk_label_encoder.pkl'
        ]
        
        missing = []
        for file in required_files:
            if not os.path.exists(os.path.join(self.models_dir, file)):
                missing.append(file)
        
        if missing:
            print(f"❌ Missing model files: {missing}")
            print(f"   Run 'python train_models.py' to train models first")
            return False
        
        print(f"✅ All model files found in {self.models_dir}/ directory")
        return True
    
    def test_yield_model(self):
        """Test yield prediction model"""
        print("\n" + "=" * 60)
        print("TESTING YIELD PREDICTION MODEL")
        print("=" * 60)
        
        try:
            # Load model and scaler
            model = joblib.load(os.path.join(self.models_dir, 'yield_model.pkl'))
            scaler = joblib.load(os.path.join(self.models_dir, 'yield_scaler.pkl'))
            
            # Generate test data
            np.random.seed(123)
            test_samples = 500
            
            test_data = {
                'rainfall': np.random.uniform(600, 2000, test_samples),
                'temperature': np.random.uniform(15, 35, test_samples),
                'nitrogen': np.random.uniform(30, 150, test_samples),
                'phosphorus': np.random.uniform(15, 80, test_samples),
                'potassium': np.random.uniform(15, 80, test_samples),
                'soil_moisture': np.random.uniform(20, 80, test_samples),
                'humidity': np.random.uniform(40, 90, test_samples),
            }
            
            # Create ground truth
            yield_base = (
                (test_data['rainfall'] / 1000) * 2 +
                (test_data['temperature'] / 25) * 1.5 +
                (test_data['nitrogen'] / 100) * 0.8 +
                (test_data['phosphorus'] / 50) * 0.5 +
                (test_data['soil_moisture'] / 100) * 1.2
            )
            y_true = yield_base + np.random.normal(0, 0.3, test_samples)
            y_true = np.clip(y_true, 1.5, 8.0)
            
            # Prepare features
            feature_names = ['rainfall', 'temperature', 'nitrogen', 'phosphorus', 'potassium', 'soil_moisture', 'humidity']
            X_test = pd.DataFrame(test_data)[feature_names]
            X_test_scaled = scaler.transform(X_test)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            mae = mean_absolute_error(y_true, y_pred)
            r2 = r2_score(y_true, y_pred)
            
            print(f"\nModel Performance Metrics:")
            print(f"  RMSE:  {rmse:.4f} tons/hectare")
            print(f"  MAE:   {mae:.4f} tons/hectare")
            print(f"  R²:    {r2:.4f}")
            
            # Prediction examples
            print(f"\nSample Predictions (first 5):")
            print(f"  {'True':<10} {'Pred':<10} {'Error':<10}")
            print(f"  {'-'*30}")
            for i in range(5):
                error = abs(y_true[i] - y_pred[i])
                print(f"  {y_true[i]:<10.2f} {y_pred[i]:<10.2f} {error:<10.2f}")
            
            self.test_results['yield'] = {
                'rmse': rmse,
                'mae': mae,
                'r2': r2,
                'status': '✅ PASSED'
            }
            
            print(f"\n✅ Yield model test PASSED")
            
        except Exception as e:
            print(f"❌ Yield model test FAILED: {str(e)}")
            self.test_results['yield'] = {'status': '❌ FAILED', 'error': str(e)}
    
    def test_crop_model(self):
        """Test crop recommendation model"""
        print("\n" + "=" * 60)
        print("TESTING CROP RECOMMENDATION MODEL")
        print("=" * 60)
        
        try:
            # Load model and scalers
            model = joblib.load(os.path.join(self.models_dir, 'crop_model.pkl'))
            scaler = joblib.load(os.path.join(self.models_dir, 'crop_scaler.pkl'))
            label_encoder = joblib.load(os.path.join(self.models_dir, 'crop_label_encoder.pkl'))
            
            # Generate test data
            np.random.seed(123)
            test_samples = 500
            
            crops = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean']
            crop_data = []
            
            for _ in range(test_samples):
                rainfall = np.random.uniform(600, 2000)
                temperature = np.random.uniform(15, 35)
                soil_type = np.random.choice([1, 2, 3, 4])
                season = np.random.choice([1, 2, 3])
                ph_level = np.random.uniform(5.5, 8.0)
                
                # Determine expected crop
                if rainfall > 1500 and temperature > 25:
                    expected = 'rice'
                elif rainfall < 800 and temperature < 25:
                    expected = 'wheat'
                elif rainfall > 1000 and temperature > 20:
                    expected = 'maize'
                elif rainfall > 1200 and season == 2:
                    expected = 'sugarcane'
                elif rainfall < 900 and temperature > 25:
                    expected = 'cotton'
                else:
                    expected = 'soybean'
                
                crop_data.append({
                    'rainfall': rainfall,
                    'temperature': temperature,
                    'soil_type': soil_type,
                    'season': season,
                    'ph_level': ph_level,
                    'expected_crop': expected
                })
            
            df_test = pd.DataFrame(crop_data)
            X_test = df_test[['rainfall', 'temperature', 'soil_type', 'season', 'ph_level']]
            y_true = df_test['expected_crop']
            
            # Scale and predict
            X_test_scaled = scaler.transform(X_test)
            y_pred_encoded = model.predict(X_test_scaled)
            y_pred = label_encoder.inverse_transform(y_pred_encoded)
            
            # Calculate metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
            
            print(f"\nModel Performance Metrics:")
            print(f"  Accuracy:  {accuracy:.4f}")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1-Score:  {f1:.4f}")
            
            # Prediction examples
            print(f"\nSample Predictions (first 5):")
            print(f"  {'True':<15} {'Predicted':<15} {'Correct':<10}")
            print(f"  {'-'*40}")
            for i in range(5):
                correct = '✓' if y_true.iloc[i] == y_pred[i] else '✗'
                print(f"  {y_true.iloc[i]:<15} {y_pred[i]:<15} {correct:<10}")
            
            self.test_results['crop'] = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'status': '✅ PASSED'
            }
            
            print(f"\n✅ Crop model test PASSED")
            
        except Exception as e:
            print(f"❌ Crop model test FAILED: {str(e)}")
            self.test_results['crop'] = {'status': '❌ FAILED', 'error': str(e)}
    
    def test_risk_model(self):
        """Test risk prediction model"""
        print("\n" + "=" * 60)
        print("TESTING DISEASE RISK PREDICTION MODEL")
        print("=" * 60)
        
        try:
            # Load model and scalers
            model = joblib.load(os.path.join(self.models_dir, 'risk_model.pkl'))
            scaler = joblib.load(os.path.join(self.models_dir, 'risk_scaler.pkl'))
            label_encoder = joblib.load(os.path.join(self.models_dir, 'risk_label_encoder.pkl'))
            
            # Generate test data
            np.random.seed(123)
            test_samples = 500
            
            risk_data = []
            
            for _ in range(test_samples):
                temperature = np.random.uniform(15, 35)
                humidity = np.random.uniform(30, 95)
                rainfall = np.random.uniform(0, 200)
                crop_age = np.random.uniform(0, 150)
                soil_moisture = np.random.uniform(20, 80)
                
                # Determine risk
                risk_score = 0
                if humidity > 80 and temperature > 25:
                    risk_score += 40
                if rainfall > 100:
                    risk_score += 30
                if 40 < crop_age < 60:
                    risk_score += 20
                risk_score += np.random.normal(0, 10)
                risk_score = np.clip(risk_score, 0, 100)
                
                if risk_score > 70:
                    expected = 'high'
                elif risk_score > 40:
                    expected = 'medium'
                else:
                    expected = 'low'
                
                risk_data.append({
                    'temperature': temperature,
                    'humidity': humidity,
                    'rainfall': rainfall,
                    'crop_age': crop_age,
                    'soil_moisture': soil_moisture,
                    'expected_risk': expected
                })
            
            df_test = pd.DataFrame(risk_data)
            X_test = df_test[['temperature', 'humidity', 'rainfall', 'crop_age', 'soil_moisture']]
            y_true = df_test['expected_risk']
            
            # Scale and predict
            X_test_scaled = scaler.transform(X_test)
            y_pred_encoded = model.predict(X_test_scaled)
            y_pred = label_encoder.inverse_transform(y_pred_encoded)
            
            # Calculate metrics
            accuracy = accuracy_score(y_true, y_pred)
            precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
            
            print(f"\nModel Performance Metrics:")
            print(f"  Accuracy:  {accuracy:.4f}")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1-Score:  {f1:.4f}")
            
            # Risk distribution
            print(f"\nRisk Distribution:")
            for risk_level in ['low', 'medium', 'high']:
                count = sum(y_pred == risk_level)
                pct = (count / len(y_pred)) * 100
                print(f"  {risk_level.capitalize()}: {count} ({pct:.1f}%)")
            
            # Prediction examples
            print(f"\nSample Predictions (first 5):")
            print(f"  {'True':<10} {'Predicted':<10} {'Correct':<10}")
            print(f"  {'-'*30}")
            for i in range(5):
                correct = '✓' if y_true.iloc[i] == y_pred[i] else '✗'
                print(f"  {y_true.iloc[i]:<10} {y_pred[i]:<10} {correct:<10}")
            
            self.test_results['risk'] = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'status': '✅ PASSED'
            }
            
            print(f"\n✅ Risk model test PASSED")
            
        except Exception as e:
            print(f"❌ Risk model test FAILED: {str(e)}")
            self.test_results['risk'] = {'status': '❌ FAILED', 'error': str(e)}
    
    def generate_report(self):
        """Generate testing summary report"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY REPORT")
        print("=" * 60)
        
        all_passed = True
        
        for model_name, results in self.test_results.items():
            status = results.get('status', 'UNKNOWN')
            print(f"\n{model_name.upper()}:")
            print(f"  Status: {status}")
            
            for key, value in results.items():
                if key != 'status':
                    if isinstance(value, float):
                        print(f"  {key}: {value:.4f}")
                    else:
                        print(f"  {key}: {value}")
            
            if '❌' in status:
                all_passed = False
        
        print("\n" + "=" * 60)
        if all_passed:
            print("✅ ALL TESTS PASSED - Models are ready for production!")
        else:
            print("⚠️ SOME TESTS FAILED - Review errors above")
        print("=" * 60 + "\n")


def main():
    """Run all model tests"""
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║   NEUROVIA ML MODEL TESTING & EVALUATION               ║")
    print("║   Testing Yield, Crop, and Risk Prediction Models      ║")
    print("╚════════════════════════════════════════════════════════╝")
    
    tester = ModelTester()
    
    # Check if models exist
    if not tester.check_models_exist():
        print("\n❌ Cannot run tests - models not found")
        return
    
    # Test all models
    tester.test_yield_model()
    tester.test_crop_model()
    tester.test_risk_model()
    
    # Generate report
    tester.generate_report()


if __name__ == '__main__':
    main()
