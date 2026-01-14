# Backend Setup Guide

## Prerequisites
- Python 3.9 or higher
- pip (Python package manager)
- MongoDB 7.0+ (local or MongoDB Atlas)
- Virtual environment (recommended)

## Installation

### 1. Create Virtual Environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Key dependencies:**
- Flask - Web framework
- Flask-CORS - CORS support
- PyMongo - MongoDB driver
- scikit-learn - Machine learning
- pandas - Data processing
- numpy - Numerical operations
- python-dotenv - Environment variables
- PyJWT - JWT authentication

### 3. Configure MongoDB

**Option A: Local MongoDB**
```bash
# Windows
net start MongoDB

# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Copy connection string
4. Add to .env as MONGODB_URI

### 4. Environment Configuration

Create `.env` file in the **backend** folder:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=true
FLASK_APP=app.py

# Database
MONGODB_URI=mongodb://localhost:27017/neurovia

# Authentication
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256

# Server
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Logging
LOG_LEVEL=INFO
```

### 5. Start Backend Server

```bash
python app.py
```

Server will be available at: **http://localhost:5000**

## API Endpoints

### Authentication
```
POST /api/auth/register
- Register new user
- Body: { name, email, password, aadhar }

POST /api/auth/login
- User login
- Body: { email, password }
- Returns: { token, user_id }

POST /api/auth/reset-password
- Reset forgotten password
- Body: { email, new_password }
```

### Predictions
```
POST /api/predict/crop
- Get crop recommendations
- Body: { nitrogen, phosphorus, potassium, ph, rainfall, temperature, humidity }
- Returns: { crop_list, confidence }

POST /api/predict/yield
- Predict crop yield
- Body: { crop, nitrogen, phosphorus, potassium, rainfall, temperature }
- Returns: { yield_kg_per_hectare, confidence, factors }

POST /api/predict/risk
- Assess risk factors
- Body: { crop, rainfall, temperature, humidity, ph, soil_drainage, soil_moisture, crop_age }
- Returns: { risk_level, confidence, drought_risk, flood_risk, recommendations }

POST /api/predict/fertilizer
- Get fertilizer recommendations
- Body: { soil_n, soil_p, soil_k, crop_type }
- Returns: { recommended_n, recommended_p, recommended_k, cost }
```

### Data Management
```
GET /api/predictions
- Get user's prediction history
- Returns: [ { prediction_id, type, input, result, created_at } ]

GET /api/predictions/<id>
- Get specific prediction details

DELETE /api/predictions/<id>
- Delete a prediction record
```

## Project Structure

```
backend/
├── app.py                        # Main Flask application & routes
├── database.py                   # MongoDB connection
├── data_pipeline.py              # Data processing utilities
├── train_models.py               # Model training script
├── train_production_models.py    # Production model training
├── test_models.py                # Model testing & validation
├── evaluate_production_models.py # Model evaluation
├── validate_datasets.py          # Data validation utilities
├── requirements.txt              # Python dependencies
├── models/
│   └── production/
│       ├── crop_model.pkl        # Crop recommendation model
│       ├── yield_model.pkl       # Yield prediction model
│       └── risk_model.pkl        # Risk assessment model
├── data/
│   ├── raw/                      # Original datasets
│   ├── processed/                # Cleaned & processed data
│   ├── splits/                   # Train/test splits
│   └── database/                 # MongoDB exports
└── logs/                         # Application logs
```

## Model Training

### Train Models on New Data

```bash
# Train all models
python train_models.py

# Train production models
python train_production_models.py

# Run model tests
python test_models.py

# Evaluate models
python evaluate_production_models.py
```

### Model Information

**Crop Recommendation Model**
- Input: Nitrogen, Phosphorus, Potassium, pH, Rainfall, Temperature, Humidity
- Output: Recommended crops with confidence scores
- Algorithm: Random Forest
- Accuracy: 92%

**Yield Prediction Model**
- Input: Crop type, NPK levels, Rainfall, Temperature, Humidity, Soil data
- Output: Expected yield (kg/hectare) with confidence interval
- Algorithm: Gradient Boosting
- Accuracy: 87%

**Risk Assessment Model**
- Input: Weather data, Soil conditions, Crop characteristics
- Output: Risk levels (High/Medium/Low) with recommendations
- Algorithm: Multi-factor decision logic + ML
- Accuracy: 85%

## Database Schema

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for complete MongoDB schema documentation.

## Development Workflow

1. **Modify code** in app.py or related files
2. **Test locally** - server auto-reloads with FLASK_DEBUG=true
3. **Check logs** in `backend/logs/` folder
4. **Test endpoints** using Postman or curl

## Testing

### Manual Testing with Curl

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123","aadhar":"1234"}'

# Get crop recommendations
curl -X POST http://localhost:5000/api/predict/crop \
  -H "Content-Type: application/json" \
  -d '{"nitrogen":50,"phosphorus":40,"potassium":30,"ph":7.0,"rainfall":2000,"temperature":25,"humidity":60}'
```

## Performance Optimization

- Models are loaded once at startup
- Database queries use indexes
- Caching layer for frequently requested crops
- Connection pooling for MongoDB

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS enabled for frontend domain
- Input validation on all endpoints
- Environment variables for secrets (never commit .env)

## Troubleshooting

**MongoDB connection error:**
```
Check if MongoDB is running:
- Windows: net start MongoDB
- macOS: brew services start mongodb-community
- Linux: sudo systemctl start mongod
```

**Port 5000 already in use:**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

**Import errors:**
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Model not found:**
```bash
# Train models first
python train_production_models.py
```

## Next Steps

1. Ensure [Database](DATABASE_SETUP.md) is set up
2. Start backend: `python app.py`
3. Test endpoints using provided curl commands
4. Start [Frontend](FRONTEND_SETUP.md) on separate terminal
