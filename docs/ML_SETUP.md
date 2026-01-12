# ML Models Setup Guide

## Train Models

### Option 1: Train with Synthetic Data (Already Done)
```bash
cd backend
python train_models.py
```

### Option 2: Train with Real Data
```bash
# 1. Validate datasets
python validate_datasets.py

# 2. Process data
python data_pipeline.py --all

# 3. Train production models
python train_production_models.py
```

## Test Models
```bash
python test_models.py
```

## Current Model Performance

**Yield Prediction:**
- Algorithm: Gradient Boosting
- R² Score: 0.8960
- RMSE: 0.3282

**Crop Recommendation:**
- Algorithm: Random Forest
- Accuracy: 99.50%
- Crops Supported: 22 types

**Risk Prediction:**
- Algorithm: Random Forest
- Accuracy: 83.75%
- Risk Levels: Low, Medium, High

## Model Files Location
```
backend/models/
├── yield_model.pkl
├── yield_scaler.pkl
├── crop_model.pkl
├── crop_scaler.pkl
├── crop_label_encoder.pkl
├── risk_model.pkl
├── risk_scaler.pkl
└── risk_label_encoder.pkl
```

## Features Used

**Yield Model:** nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall

**Crop Model:** nitrogen, phosphorus, potassium, ph, rainfall

**Risk Model:** temperature, humidity, rainfall, nitrogen, phosphorus
