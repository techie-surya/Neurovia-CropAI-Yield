# Neurovia ML Model Training & Testing Automation Script (Windows)
# This script trains and tests all ML models for the Neurovia platform

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NEUROVIA ML TRAINING & TESTING AUTOMATION            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python is not installed. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if we're in the backend directory
if (-Not (Test-Path "app.py")) {
    Write-Host "❌ app.py not found. Make sure you're in the backend directory." -ForegroundColor Red
    Write-Host "   Run: cd backend" -ForegroundColor Yellow
    exit 1
}

# Create models directory if it doesn't exist
if (-Not (Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" | Out-Null
}
Write-Host "✓ Models directory ready" -ForegroundColor Green

# Check for required packages
Write-Host ""
Write-Host "📦 Checking required packages..." -ForegroundColor Yellow

try {
    python -c "import pandas, sklearn, joblib, numpy" 2>$null
    Write-Host "✓ All packages available" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Missing required packages. Installing..." -ForegroundColor Yellow
    pip install pandas scikit-learn joblib numpy
}

# Train models
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Step 1: TRAINING MODELS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

python train_models.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Model training failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Model training completed successfully!" -ForegroundColor Green

# Test models
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Step 2: TESTING MODELS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

python test_models.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Model testing failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Model testing completed successfully!" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   COMPLETION SUMMARY                                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Training completed" -ForegroundColor Green
Write-Host "✅ Testing completed" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Trained models saved in: models/" -ForegroundColor Cyan
Write-Host "   - yield_model.pkl (Yield Prediction)" -ForegroundColor Cyan
Write-Host "   - crop_model.pkl (Crop Recommendation)" -ForegroundColor Cyan
Write-Host "   - risk_model.pkl (Risk Prediction)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Start Flask backend: python app.py" -ForegroundColor Yellow
Write-Host "   2. Frontend will automatically use trained models" -ForegroundColor Yellow
Write-Host "   3. Monitor predictions in MongoDB" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 For more info: Read ML_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
