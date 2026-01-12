# 🐍 BACKEND IMPLEMENTATION GUIDE
## Converting Frontend to Full-Stack Application

---

## 📋 OVERVIEW

This guide shows you how to convert the React frontend into a full-stack application with a Python/Flask backend and real ML models.

**Current Status:** Frontend-only with mock ML  
**Target Status:** Full-stack with Python backend and trained models  

---

## 🗂️ BACKEND PROJECT STRUCTURE

```
/backend
├── app.py                      # Flask application entry point
├── model_training.py           # Train ML models
├── requirements.txt            # Python dependencies
├── /models
│   ├── yield_predictor.pkl    # Trained Random Forest model
│   ├── crop_recommender.pkl   # Trained Classifier model
│   └── risk_predictor.pkl     # Trained Logistic Regression model
├── /data
│   ├── crop_dataset.csv       # Training dataset
│   └── soil_weather_data.csv  # Additional data
└── /utils
    ├── preprocessing.py        # Data preprocessing functions
    └── feature_engineering.py  # Feature creation
```

---

## 📦 STEP 1: DEPENDENCIES (requirements.txt)

```python
# requirements.txt
flask==3.0.0
flask-cors==4.0.0
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
xgboost==2.0.2
joblib==1.3.2
python-dotenv==1.0.0
```

**Install:**
```bash
pip install -r requirements.txt
```

---

## 🤖 STEP 2: MODEL TRAINING (model_training.py)

```python
# backend/model_training.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
import joblib

# ============================================
# 1. YIELD PREDICTION MODEL
# ============================================

def train_yield_predictor():
    """
    Train Random Forest model for crop yield prediction
    """
    # Load dataset (you'll need to create this)
    df = pd.read_csv('data/crop_dataset.csv')
    
    # Features: Nitrogen, Phosphorus, Potassium, pH, Rainfall, Temperature
    # Target: Yield (kg/hectare)
    
    X = df[['nitrogen', 'phosphorus', 'potassium', 'ph', 'rainfall', 'temperature', 'crop_encoded']]
    y = df['yield']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Yield Predictor - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
    
    # Save model
    joblib.dump(model, 'models/yield_predictor.pkl')
    print("✓ Yield predictor saved!")
    
    return model

# ============================================
# 2. CROP RECOMMENDATION MODEL
# ============================================

def train_crop_recommender():
    """
    Train XGBoost classifier for crop recommendation
    """
    df = pd.read_csv('data/crop_dataset.csv')
    
    X = df[['nitrogen', 'phosphorus', 'potassium', 'ph', 'rainfall', 'temperature']]
    y = df['crop_encoded']  # Encoded crop labels (0-7)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=10,
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    print(f"Crop Recommender - Train Acc: {train_acc:.3f}, Test Acc: {test_acc:.3f}")
    
    joblib.dump(model, 'models/crop_recommender.pkl')
    print("✓ Crop recommender saved!")
    
    return model

# ============================================
# 3. RISK PREDICTION MODEL
# ============================================

def train_risk_predictor():
    """
    Train Logistic Regression for risk assessment
    """
    df = pd.read_csv('data/crop_dataset.csv')
    
    X = df[['nitrogen', 'phosphorus', 'potassium', 'ph', 'rainfall', 'temperature', 'crop_encoded']]
    y = df['risk_level']  # 0=Low, 1=Medium, 2=High
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = LogisticRegression(
        multi_class='multinomial',
        solver='lbfgs',
        max_iter=1000,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    print(f"Risk Predictor - Train Acc: {train_acc:.3f}, Test Acc: {test_acc:.3f}")
    
    joblib.dump(model, 'models/risk_predictor.pkl')
    print("✓ Risk predictor saved!")
    
    return model

# ============================================
# TRAIN ALL MODELS
# ============================================

if __name__ == "__main__":
    print("🚀 Starting model training...\n")
    
    print("1. Training Yield Predictor...")
    train_yield_predictor()
    
    print("\n2. Training Crop Recommender...")
    train_crop_recommender()
    
    print("\n3. Training Risk Predictor...")
    train_risk_predictor()
    
    print("\n✅ All models trained successfully!")
```

---

## 🌐 STEP 3: FLASK API (app.py)

```python
# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load trained models
yield_model = joblib.load('models/yield_predictor.pkl')
crop_model = joblib.load('models/crop_recommender.pkl')
risk_model = joblib.load('models/risk_predictor.pkl')

# Crop encoding mapping
CROP_MAPPING = {
    'rice': 0, 'wheat': 1, 'corn': 2, 'cotton': 3,
    'sugarcane': 4, 'soybean': 5, 'potato': 6, 'tomato': 7
}
CROP_REVERSE = {v: k for k, v in CROP_MAPPING.items()}

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AgroIntelliSense API is running'
    })

# ============================================
# 1. YIELD PREDICTION ENDPOINT
# ============================================

@app.route('/api/predict-yield', methods=['POST'])
def predict_yield():
    """
    Predict crop yield based on soil and weather conditions
    
    Request Body:
    {
        "crop": "rice",
        "nitrogen": 80,
        "phosphorus": 40,
        "potassium": 40,
        "ph": 6.5,
        "rainfall": 1200,
        "temperature": 28
    }
    """
    try:
        data = request.json
        
        # Prepare features
        crop_encoded = CROP_MAPPING[data['crop'].lower()]
        features = np.array([[
            data['nitrogen'],
            data['phosphorus'],
            data['potassium'],
            data['ph'],
            data['rainfall'],
            data['temperature'],
            crop_encoded
        ]])
        
        # Predict yield
        predicted_yield = yield_model.predict(features)[0]
        
        # Predict risk
        risk_probs = risk_model.predict_proba(features)[0]
        risk_level_idx = np.argmax(risk_probs)
        risk_levels = ['Low', 'Medium', 'High']
        risk_level = risk_levels[risk_level_idx]
        
        # Calculate confidence (based on risk probabilities)
        confidence = max(risk_probs) * 100
        
        return jsonify({
            'success': True,
            'predictedYield': round(predicted_yield, 2),
            'riskLevel': risk_level,
            'riskScore': round((1 - max(risk_probs)) * 100, 2),
            'confidence': round(confidence, 2)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# ============================================
# 2. CROP RECOMMENDATION ENDPOINT
# ============================================

@app.route('/api/recommend-crops', methods=['POST'])
def recommend_crops():
    """
    Recommend best crops for given conditions
    
    Request Body:
    {
        "nitrogen": 80,
        "phosphorus": 40,
        "potassium": 40,
        "ph": 6.5,
        "rainfall": 800,
        "temperature": 25
    }
    """
    try:
        data = request.json
        
        features = np.array([[
            data['nitrogen'],
            data['phosphorus'],
            data['potassium'],
            data['ph'],
            data['rainfall'],
            data['temperature']
        ]])
        
        # Get probabilities for all crops
        probabilities = crop_model.predict_proba(features)[0]
        
        # Get top 3 crops
        top_3_indices = np.argsort(probabilities)[-3:][::-1]
        
        recommendations = []
        for idx in top_3_indices:
            crop_name = CROP_REVERSE[idx]
            suitability = probabilities[idx] * 100
            
            # Predict yield for this crop
            crop_features = np.append(features[0], idx).reshape(1, -1)
            expected_yield = yield_model.predict(crop_features)[0]
            
            recommendations.append({
                'crop': crop_name,
                'suitabilityScore': round(suitability, 2),
                'expectedYield': round(expected_yield, 2),
                'reason': f'Good compatibility with your soil and climate'
            })
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

# ============================================
# 3. WHAT-IF SIMULATOR ENDPOINT
# ============================================

@app.route('/api/simulate', methods=['POST'])
def simulate_scenario():
    """
    Run what-if scenario simulation
    
    Request Body:
    {
        "baseline": { crop, nitrogen, phosphorus, ... },
        "simulated": { crop, nitrogen, phosphorus, ... }
    }
    """
    try:
        data = request.json
        baseline = data['baseline']
        simulated = data['simulated']
        
        # Predict both scenarios
        baseline_result = predict_single_scenario(baseline)
        simulated_result = predict_single_scenario(simulated)
        
        return jsonify({
            'success': True,
            'baseline': baseline_result,
            'simulated': simulated_result,
            'yieldDifference': simulated_result['predictedYield'] - baseline_result['predictedYield'],
            'yieldDifferencePercent': round(
                ((simulated_result['predictedYield'] - baseline_result['predictedYield']) / 
                 baseline_result['predictedYield']) * 100, 2
            )
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def predict_single_scenario(scenario):
    """Helper function to predict a single scenario"""
    crop_encoded = CROP_MAPPING[scenario['crop'].lower()]
    features = np.array([[
        scenario['nitrogen'],
        scenario['phosphorus'],
        scenario['potassium'],
        scenario['ph'],
        scenario['rainfall'],
        scenario['temperature'],
        crop_encoded
    ]])
    
    predicted_yield = yield_model.predict(features)[0]
    risk_probs = risk_model.predict_proba(features)[0]
    risk_level_idx = np.argmax(risk_probs)
    risk_levels = ['Low', 'Medium', 'High']
    
    return {
        'predictedYield': round(predicted_yield, 2),
        'riskLevel': risk_levels[risk_level_idx],
        'confidence': round(max(risk_probs) * 100, 2)
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    print("🚀 Starting AgroIntelliSense API...")
    print("📍 Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## 📊 STEP 4: DATASET STRUCTURE (crop_dataset.csv)

```csv
nitrogen,phosphorus,potassium,ph,rainfall,temperature,crop,crop_encoded,yield,risk_level
80,40,40,6.5,1200,28,rice,0,4500,0
100,50,30,6.8,450,22,wheat,1,3200,0
120,60,50,6.2,600,25,corn,2,5500,0
90,45,35,7.0,700,30,cotton,3,2800,1
150,70,80,6.5,1500,32,sugarcane,4,70000,0
40,35,45,6.5,500,26,soybean,5,2800,0
110,55,60,5.8,550,20,potato,6,25000,1
100,50,70,6.3,600,24,tomato,7,35000,0
...
```

**How to create this dataset:**
1. Use existing agricultural datasets (USDA, FAO, Indian agriculture data)
2. Augment with synthetic data based on agricultural science
3. Aim for 1000+ rows for good training

---

## 🔌 STEP 5: CONNECT FRONTEND TO BACKEND

Update your frontend API calls:

```typescript
// Create a new file: /utils/api.ts

const API_BASE_URL = 'http://localhost:5000/api';

export async function predictYield(data: PredictionInput) {
  const response = await fetch(`${API_BASE_URL}/predict-yield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function recommendCrops(data: any) {
  const response = await fetch(`${API_BASE_URL}/recommend-crops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function simulateScenario(baseline: any, simulated: any) {
  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseline, simulated })
  });
  return response.json();
}
```

Then update your components to use real API:

```typescript
// In YieldPrediction.tsx, replace mock prediction with:
const prediction = await predictYield(formData);
```

---

## 🚀 STEP 6: RUN THE FULL STACK

### Terminal 1 - Backend
```bash
cd backend
python model_training.py  # Train models first
python app.py             # Start Flask server
```

### Terminal 2 - Frontend
```bash
npm run dev  # Start React app
```

**Access:** http://localhost:5173

---

## 📈 STEP 7: IMPROVING MODEL ACCURACY

### Collect Real Data
```python
# Example: Scrape or use APIs
- https://data.gov.in (Indian agriculture data)
- USDA National Agricultural Statistics
- FAO (Food and Agriculture Organization)
```

### Feature Engineering
```python
# Add new features for better accuracy
- Soil moisture content
- Elevation
- Crop variety
- Previous year yield
- Fertilizer application method
- Pest incidence history
```

### Hyperparameter Tuning
```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [10, 15, 20],
    'min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestRegressor(),
    param_grid,
    cv=5,
    scoring='r2'
)

grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_
```

---

## 🐳 STEP 8: DEPLOYMENT (Docker)

### Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./backend/models:/app/models

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 📱 STEP 9: PRODUCTION CHECKLIST

✅ **Security**
- Add API authentication (JWT tokens)
- Validate all inputs
- Use HTTPS
- Rate limiting

✅ **Performance**
- Cache predictions
- Use CDN for frontend
- Optimize model loading
- Database connection pooling

✅ **Monitoring**
- Error logging (Sentry)
- Analytics (Google Analytics)
- Model performance tracking
- API usage metrics

✅ **Scalability**
- Use Gunicorn for Flask
- Load balancing
- Database replication
- Model versioning

---

## 🎯 QUICK START SUMMARY

```bash
# 1. Setup backend
cd backend
pip install -r requirements.txt
python model_training.py
python app.py

# 2. Update frontend API calls
# Replace mock functions with real API calls

# 3. Start frontend
npm run dev

# 4. Test the full stack!
```

---

## 🤝 ADDITIONAL RESOURCES

**Datasets:**
- [Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
- [Agricultural Data](https://data.gov.in)
- [FAO Statistics](http://www.fao.org/faostat/)

**ML Libraries:**
- scikit-learn: https://scikit-learn.org
- XGBoost: https://xgboost.readthedocs.io
- Flask: https://flask.palletsprojects.com

**Deployment:**
- Heroku (easy): https://heroku.com
- AWS (scalable): https://aws.amazon.com
- DigitalOcean (affordable): https://digitalocean.com

---

## 💡 TIPS FOR SUCCESS

1. **Start Simple:** Get basic prediction working first
2. **Iterate:** Improve accuracy gradually with more data
3. **Test Thoroughly:** Use cross-validation
4. **Document:** Keep track of model versions and performance
5. **Monitor:** Watch for model drift in production

---

**You now have everything you need to build a full-stack AI agriculture platform! 🌾🚀**
