# Database Setup Guide

## MongoDB Overview

MongoDB is a NoSQL document database used to store user data, prediction history, and configuration. It provides flexible schema and horizontal scalability.

**Neurovia uses MongoDB for:**
- User accounts and authentication
- Prediction history and results
- Feedback and analytics

## Installation

### Option 1: Local MongoDB (Recommended for Development)

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer (MSI file)
3. Choose "Run service as Network Service"
4. Complete installation
5. Start MongoDB service:
```bash
net start MongoDB
```

Verify installation:
```bash
mongosh
```

#### macOS (Using Homebrew)
```bash
# Install
brew install mongodb-community

# Start service
brew services start mongodb-community

# Connect
mongosh
```

#### Linux (Ubuntu/Debian)
```bash
# Install
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod

# Connect
mongosh
```

### Option 2: MongoDB Atlas (Cloud Database)

**Perfect for production and easy deployment:**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a new project
3. Create a cluster (choose Free tier for hackathon)
4. Create a database user with username and password
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/neurovia?retryWrites=true&w=majority
   ```
6. Add to backend `.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/neurovia
   ```

## Database Configuration

### Default Connection
```
Database Name: neurovia
Default URI (local): mongodb://localhost:27017/neurovia
Default URI (Atlas): mongodb+srv://<user>:<pass>@cluster.mongodb.net/neurovia
```

### Connect Using Mongosh
```bash
# Local
mongosh mongodb://localhost:27017/neurovia

# Atlas
mongosh "mongodb+srv://<username>:<password>@cluster.mongodb.net/neurovia"
```

## Database Schema

### Collection: users

Stores user account information.

```javascript
{
  _id: ObjectId,                  // MongoDB auto-generated ID
  name: String,                   // User's full name
  email: String,                  // Email (unique)
  aadhar: String,                 // Aadhar ID (optional, unique)
  password: String,               // Hashed password (bcrypt)
  phone: String,                  // Contact number (optional)
  region: String,                 // Agricultural region/state
  role: String,                   // "farmer" or "admin"
  subscription_tier: String,      // "free" or "premium"
  is_verified: Boolean,           // Email verification status
  is_active: Boolean,             // Account active status
  created_at: Date,               // Account creation timestamp
  updated_at: Date,               // Last update timestamp
  last_login: Date,               // Last login timestamp
  metadata: {
    preferred_language: String,   // "en" or "hi"
    timezone: String,             // User's timezone
    notifications_enabled: Boolean
  }
}
```

**Example:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Raj Kumar",
  email: "raj@example.com",
  aadhar: "1234-5678-9012",
  password: "$2b$12$...",
  phone: "+91-9876543210",
  region: "Punjab",
  role: "farmer",
  subscription_tier: "free",
  is_verified: true,
  is_active: true,
  created_at: ISODate("2024-01-14T10:00:00Z"),
  updated_at: ISODate("2024-01-14T15:30:00Z"),
  last_login: ISODate("2024-01-14T15:30:00Z"),
  metadata: {
    preferred_language: "hi",
    timezone: "IST",
    notifications_enabled: true
  }
}
```

### Collection: predictions

Stores all prediction results for auditing and history.

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,              // Reference to users collection
  prediction_type: String,        // "crop" | "yield" | "risk" | "fertilizer"
  input_data: {
    // Varies based on prediction type
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number,
    rainfall: Number,
    temperature: Number,
    humidity: Number,
    soil_type: String,
    soil_drainage: Number,
    crop: String,
    crop_age: Number
  },
  result: {
    // Varies based on prediction type
    prediction: String,           // Predicted crop/yield/risk level
    confidence: Number,           // 0-1 confidence score
    risk_factors: [String],       // List of contributing factors
    recommendations: [String],    // Action items for farmer
    details: Object               // Additional details
  },
  status: String,                 // "success" | "error"
  model_version: String,          // Model version used
  processing_time_ms: Number,     // API response time
  created_at: Date,
  updated_at: Date
}
```

**Example (Crop Prediction):**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  prediction_type: "crop",
  input_data: {
    nitrogen: 50,
    phosphorus: 40,
    potassium: 30,
    ph: 7.2,
    rainfall: 2000,
    temperature: 25,
    humidity: 65
  },
  result: {
    prediction: "Rice",
    confidence: 0.92,
    risk_factors: ["High rainfall expected"],
    recommendations: [
      "Plant high-yield rice varieties",
      "Ensure proper drainage",
      "Apply nitrogen fertilizer in 2 splits"
    ],
    details: {
      top_3_crops: [
        { crop: "Rice", confidence: 0.92 },
        { crop: "Maize", confidence: 0.78 },
        { crop: "Sugarcane", confidence: 0.65 }
      ]
    }
  },
  status: "success",
  model_version: "v1.0",
  processing_time_ms: 145,
  created_at: ISODate("2024-01-14T10:30:00Z"),
  updated_at: ISODate("2024-01-14T10:30:00Z")
}
```

### Collection: feedback

Optional - stores user feedback for ML model improvements.

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  prediction_id: ObjectId,        // Reference to prediction
  feedback: String,               // User's feedback
  rating: Number,                 // 1-5 star rating
  is_helpful: Boolean,            // Was prediction helpful?
  actual_result: String,          // What actually happened
  created_at: Date
}
```

## Database Indexes

Indexes improve query performance. Create them for:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ aadhar: 1 }, { unique: false })
db.users.createIndex({ created_at: -1 })
db.users.createIndex({ region: 1 })

// Predictions collection
db.predictions.createIndex({ user_id: 1 })
db.predictions.createIndex({ user_id: 1, created_at: -1 })
db.predictions.createIndex({ created_at: -1 })
db.predictions.createIndex({ prediction_type: 1 })
db.predictions.createIndex({ status: 1 })

// Feedback collection (if using)
db.feedback.createIndex({ user_id: 1 })
db.feedback.createIndex({ prediction_id: 1 })
```

## Initial Setup

### Create Database and Collections

```bash
# Connect to MongoDB
mongosh

# Switch to neurovia database
use neurovia

# Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ aadhar: 1 })
db.predictions.createIndex({ user_id: 1 })
db.predictions.createIndex({ user_id: 1, created_at: -1 })
db.predictions.createIndex({ created_at: -1 })

# Verify
show collections
db.users.getIndexes()
db.predictions.getIndexes()
```

### Seed Test Data (Optional)

```javascript
// Add test user
db.users.insertOne({
  name: "Test Farmer",
  email: "test@example.com",
  aadhar: "0000-0000-0000",
  password: "$2b$12$...",
  region: "Punjab",
  role: "farmer",
  subscription_tier: "free",
  is_verified: true,
  is_active: true,
  created_at: new Date(),
  metadata: {
    preferred_language: "en",
    timezone: "IST",
    notifications_enabled: true
  }
})
```

## Backup and Export

### Export Collections

```bash
# Export users collection
mongodump --db neurovia --collection users --out ./backups

# Export as JSON
mongo neurovia --eval "db.users.find().forEach(function(u) { print(tojson(u)) })" > users.json
```

### Import Collections

```bash
# Import from dump
mongorestore --db neurovia ./backups/neurovia

# Import JSON
mongoimport --db neurovia --collection users users.json
```

## Monitoring

### Check Database Size

```javascript
db.stats()
```

### View Collection Stats

```javascript
db.users.stats()
db.predictions.stats()
```

### Monitor Connections

```javascript
db.currentOp()  // Show active operations
```

## Security Best Practices

1. **Always use strong passwords** for database users
2. **Enable authentication** in MongoDB
3. **Use environment variables** for connection strings (never commit)
4. **Enable encryption** at rest and in transit
5. **Create separate users** for different applications
6. **Whitelist IPs** (especially for Atlas)
7. **Regular backups** - daily for production
8. **Monitor access logs** for suspicious activity

## Connection from Backend

The backend app.py connects using:

```python
from pymongo import MongoClient

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/neurovia')
client = MongoClient(MONGODB_URI)
db = client['neurovia']
```

## Troubleshooting

**Connection refused:**
```
✓ Check MongoDB is running: net start MongoDB (Windows)
✓ Check connection string in .env
✓ Check MongoDB is listening on default port 27017
```

**Authentication failed:**
```
✓ Verify username and password in connection string
✓ Check user has access to 'neurovia' database
✓ If using Atlas, check IP whitelist
```

**Disk space issues:**
```
✓ Run: db.adminCommand({ compact: 'users' })
✓ Check backup sizes: du -sh ./backups
✓ Archive old predictions if needed
```

## Next Steps

1. Install MongoDB locally or set up Atlas
2. Create neurovia database and indexes
3. Update backend .env with connection string
4. Test connection: `mongosh <connection-string>`
5. Start backend server
