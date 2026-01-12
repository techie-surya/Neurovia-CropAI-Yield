#!/bin/bash

# Neurovia ML Model Training & Testing Automation Script
# This script trains and tests all ML models for the Neurovia platform

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   NEUROVIA ML TRAINING & TESTING AUTOMATION            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found. Make sure you're in the backend directory."
    echo "   Run: cd backend"
    exit 1
fi

# Create models directory if it doesn't exist
mkdir -p models
echo "✓ Models directory ready"

# Check for required packages
echo ""
echo "📦 Checking required packages..."

python -c "import pandas, sklearn, joblib, numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠ Missing required packages. Installing..."
    pip install pandas scikit-learn joblib numpy
fi

echo "✓ All packages available"

# Train models
echo ""
echo "=========================================="
echo "Step 1: TRAINING MODELS"
echo "=========================================="
echo ""

python train_models.py

if [ $? -ne 0 ]; then
    echo "❌ Model training failed!"
    exit 1
fi

echo ""
echo "✅ Model training completed successfully!"

# Test models
echo ""
echo "=========================================="
echo "Step 2: TESTING MODELS"
echo "=========================================="
echo ""

python test_models.py

if [ $? -ne 0 ]; then
    echo "❌ Model testing failed!"
    exit 1
fi

echo ""
echo "✅ Model testing completed successfully!"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   COMPLETION SUMMARY                                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Training completed"
echo "✅ Testing completed"
echo ""
echo "📁 Trained models saved in: models/"
echo "   - yield_model.pkl (Yield Prediction)"
echo "   - crop_model.pkl (Crop Recommendation)"
echo "   - risk_model.pkl (Risk Prediction)"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Flask backend: python app.py"
echo "   2. Frontend will automatically use trained models"
echo "   3. Monitor predictions in MongoDB"
echo ""
echo "📚 For more info: Read ML_GUIDE.md"
echo ""
