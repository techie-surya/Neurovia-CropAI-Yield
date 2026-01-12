# AgroAI Platform - Backend Setup with MongoDB

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- **MongoDB** (local or cloud)

### MongoDB Setup

**Option 1: Local MongoDB**
1. Download and install MongoDB Community from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
```bash
# Windows
mongod

# Linux/Mac
brew services start mongodb-community
```

**Option 2: MongoDB Cloud (Atlas)**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/agroai`
4. Update `.env` with your connection string

### Installation

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Configure `.env` file:**
```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/agroai
JWT_SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development
FLASK_DEBUG=True
```

For MongoDB Atlas (cloud):
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agroai
```

### Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

---

## 📊 MongoDB Collections

The app automatically creates these collections:

**1. users** - Stores farmer accounts
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  aadhar: String (unique),
  password_hash: String,
  created_at: Date
}
```

**2. predictions** - Stores ML prediction history
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  prediction_type: String ("yield" | "crop" | "risk"),
  input_data: {
    crop: String,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number,
    rainfall: Number,
    temperature: Number
  },
  output_data: Object,
  created_at: Date
}
```

---

## 📚 API Endpoints

### Authentication

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Farmer Name",
  "email": "farmer@example.com",
  "aadhar": "123456789012",
  "password": "securepassword"
}

Response:
{
  "message": "Registration successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Farmer Name",
    "email": "farmer@example.com",
    "aadhar": "123456789012",
    "created_at": "2024-01-12T10:30:00"
  },
  "access_token": "eyJhbGc..."
}
```

**Login User**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "securepassword"
}

Response:
{
  "message": "Login successful",
  "user": {...},
  "access_token": "eyJhbGc..."
}
```

**Get Profile** (requires JWT token)
```
GET /api/auth/profile
Authorization: Bearer <jwt_token>

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Farmer Name",
  "email": "farmer@example.com",
  "aadhar": "123456789012",
  "created_at": "2024-01-12T10:30:00"
}
```

### ML Predictions (all require JWT token)

**Predict Crop Yield**
```
POST /api/predict-yield
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "crop": "rice",
  "nitrogen": 80,
  "phosphorus": 40,
  "potassium": 40,
  "ph": 6.5,
  "rainfall": 1200,
  "temperature": 28
}

Response:
{
  "yield": 4250.5,
  "unit": "kg/hectare",
  "confidence": 0.85
}
```

**Recommend Crop**
```
POST /api/predict-crop
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nitrogen": 80,
  "phosphorus": 40,
  "potassium": 40,
  "ph": 6.5,
  "rainfall": 1200,
  "temperature": 28
}

Response:
{
  "recommended_crop": "rice",
  "confidence": 0.92,
  "top_3": [
    {"crop": "rice", "confidence": 0.92},
    {"crop": "wheat", "confidence": 0.05},
    {"crop": "corn", "confidence": 0.03}
  ]
}
```

**Predict Risk**
```
POST /api/predict-risk
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "crop": "rice",
  "nitrogen": 80,
  "phosphorus": 40,
  "potassium": 40,
  "ph": 6.5,
  "rainfall": 1200,
  "temperature": 28
}

Response:
{
  "risk_level": "Low",
  "recommendations": [
    "Continue current farming practices",
    "Monitor soil health regularly"
  ]
}
```

**Get Prediction History**
```
GET /api/prediction-history
Authorization: Bearer <jwt_token>

Response:
{
  "count": 5,
  "predictions": [
    {
      "id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439011",
      "prediction_type": "yield",
      "input_data": {...},
      "output_data": {"yield": 4250.5},
      "created_at": "2024-01-12T10:30:00"
    }
  ]
}
```

### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "message": "AgroAI Platform API is running",
  "database": "MongoDB connected"
}
```

---

## 🔒 Authentication Flow

1. **Register** - User creates account, get JWT token
2. **Store Token** - Frontend saves JWT in localStorage
3. **Include Token** - Send token in `Authorization: Bearer <token>` header
4. **Protected Routes** - Backend validates token on protected endpoints
5. **Token Expiry** - User needs to re-login after token expires (7 days default)

---

## 📊 Testing with Postman/Insomnia

1. Register new user (copy token)
2. Set header: `Authorization: Bearer <token>`
3. Test protected endpoints with token

---

## 🚨 Troubleshooting

**MongoDB Connection Error**
- Make sure MongoDB is running: `mongod` (Windows) or `brew services start mongodb-community` (Mac)
- Check MONGODB_URI in `.env` is correct
- For local: `mongodb://localhost:27017/agroai`
- For Atlas: Include username, password, cluster

**Port 5000 already in use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

**JWT Token errors**
- Token expired: User needs to login again
- Invalid token: Check token format in Authorization header
- Missing token: Add Authorization header to protected routes

**ModuleNotFoundError**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 🔧 MongoDB Tools

**View Database**
```bash
mongosh
use agroai
db.users.find()
db.predictions.find()
```

**Clear Database**
```bash
db.users.deleteMany({})
db.predictions.deleteMany({})
```

---

## 🚀 Next Steps

1. **Train ML Models** - Place trained models in `/models` folder
2. **Deploy** - Use Gunicorn + Nginx for production
3. **Scale** - Switch to PostgreSQL if needed
4. **Monitor** - Add logging and error tracking

---

## 💡 Development Tips

- Check `/health` endpoint to verify backend is running
- Use browser DevTools to inspect API requests
- Enable CORS for testing on different ports
- Use Postman collections for API testing
- MongoDB Compass for visual database management

