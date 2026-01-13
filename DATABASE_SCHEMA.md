# MongoDB Database Schema for Neurovia

## Database Name
`neurovia`

## Collections

### 1. `users` Collection
Stores user registration and profile data.

**Schema:**
```json
{
  "_id": ObjectId,
  "name": "John Farmer",
  "email": "john@example.com",
  "aadhar": "123456789012",
  "password_hash": "bcrypt_hashed_password",
  "created_at": ISODate("2026-01-13T10:30:00Z")
}
```

**Indexes:**
- `email` (unique)
- `aadhar` (unique)

**Example Data:**
```json
{
  "_id": ObjectId("65a123abc123def456789012"),
  "name": "Rahul Sharma",
  "email": "rahul@gmail.com",
  "aadhar": "123456789123",
  "password_hash": "$2b$12$...",
  "created_at": ISODate("2026-01-13T10:30:00Z")
}
```

---

### 2. `predictions` Collection
Stores ML prediction history for each user.

**Schema:**
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "prediction_type": "yield|crop|risk",
  "input_data": {
    // varies by type
  },
  "output_data": {
    // varies by type
  },
  "model_type": "trained|mock",
  "created_at": ISODate("2026-01-13T10:30:00Z")
}
```

**Indexes:**
- `user_id`
- `created_at`

**Example Data - Yield Prediction:**
```json
{
  "_id": ObjectId("65a124bcd234efg567890123"),
  "user_id": ObjectId("65a123abc123def456789012"),
  "prediction_type": "yield",
  "input_data": {
    "rainfall": 1500,
    "temperature": 25,
    "nitrogen": 80,
    "phosphorus": 50,
    "potassium": 50,
    "soil_moisture": 50,
    "humidity": 65
  },
  "output_data": {
    "yield": 4523.45
  },
  "model_type": "trained",
  "created_at": ISODate("2026-01-13T11:00:00Z")
}
```

**Example Data - Crop Recommendation:**
```json
{
  "_id": ObjectId("65a125cde345fgh678901234"),
  "user_id": ObjectId("65a123abc123def456789012"),
  "prediction_type": "crop",
  "input_data": {
    "rainfall": 1500,
    "temperature": 25,
    "soil_type": 2,
    "season": 1,
    "ph_level": 7.0
  },
  "output_data": {
    "crop": "rice",
    "confidence": 0.85
  },
  "model_type": "trained",
  "created_at": ISODate("2026-01-13T11:05:00Z")
}
```

**Example Data - Risk Prediction:**
```json
{
  "_id": ObjectId("65a126def456ghi789012345"),
  "user_id": ObjectId("65a123abc123def456789012"),
  "prediction_type": "risk",
  "input_data": {
    "temperature": 25,
    "humidity": 65,
    "rainfall": 100,
    "crop_age": 50,
    "soil_moisture": 50
  },
  "output_data": {
    "risk_level": "Low"
  },
  "model_type": "trained",
  "created_at": ISODate("2026-01-13T11:10:00Z")
}
```

---

## How to Verify

### Check Database Connection
```bash
# Start MongoDB
mongod

# In another terminal, open MongoDB shell
mongosh

# Switch to database
use neurovia

# View collections
show collections

# Check users
db.users.find().pretty()

# Check predictions
db.predictions.find().pretty()

# Count documents
db.users.countDocuments()
db.predictions.countDocuments()
```

### Check Indexes
```javascript
db.users.getIndexes()
db.predictions.getIndexes()
```

---

## Data Flow

1. **User Registration**
   - Frontend sends name, email, aadhar, password
   - Backend hashes password and stores in `users` collection
   - JWT token returned

2. **User Login**
   - Frontend sends email, password
   - Backend verifies and returns JWT token
   - Token stored in localStorage

3. **Predictions**
   - Frontend sends input parameters (authenticated with JWT)
   - Backend makes ML prediction
   - Prediction stored in `predictions` collection with user_id
   - Response returned with prediction result

4. **Prediction History**
   - Frontend requests `/api/prediction-history`
   - Backend retrieves all predictions for that user_id
   - Displayed in dashboard

---

## Database Connection String
```
mongodb://localhost:27017/neurovia
```

## Database Name
```
neurovia
```
