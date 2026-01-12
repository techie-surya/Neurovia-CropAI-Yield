# Neurovia - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup (2 minutes)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Step 2: Frontend Setup (2 minutes)
```bash
npm install
npm run dev
```

### Step 3: Access Application (1 minute)
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## ✅ What's Already Done

- ✅ ML Models Trained (3 models)
- ✅ Backend API Ready (8 endpoints)
- ✅ Frontend UI Complete
- ✅ MongoDB Integration
- ✅ Authentication System

## 📊 Models Available

1. **Yield Prediction** - 89.6% accuracy
2. **Crop Recommendation** - 99.5% accuracy
3. **Risk Prediction** - 83.75% accuracy

## 🔧 Requirements

- Python 3.8+
- Node.js 16+
- MongoDB 4.4+

## 📚 Full Documentation

- [Backend Setup](BACKEND_SETUP.md)
- [Frontend Setup](FRONTEND_SETUP.md)
- [ML Setup](ML_SETUP.md)
- [Database Setup](DATABASE_SETUP.md)
- [Deployment](DEPLOYMENT_GUIDE.md)

## 🆘 Common Issues

**Port already in use:**
```bash
# Kill process on port 5000
taskkill /F /IM python.exe

# Kill process on port 5173
taskkill /F /IM node.exe
```

**MongoDB not running:**
```bash
net start MongoDB
```

## 📞 Support

Check documentation files for detailed setup instructions.
