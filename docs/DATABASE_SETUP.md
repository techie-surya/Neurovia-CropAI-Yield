# Database Setup Guide

## MongoDB Installation

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run installer
3. Start MongoDB service:
```bash
net start MongoDB
```

### Verify Installation
```bash
mongosh
```

## Database Configuration

### Connection String
```
mongodb://localhost:27017/neurovia
```

### Collections

**1. users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  aadhar: String,
  password: String (hashed),
  created_at: Date
}
```

**2. predictions**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  prediction_type: String,
  input_data: Object,
  result: Object,
  confidence: Number,
  created_at: Date
}
```

## Indexes
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ aadhar: 1 }, { unique: true })
db.predictions.createIndex({ user_id: 1 })
db.predictions.createIndex({ created_at: -1 })
```

## Initial Setup Script
```bash
mongosh
use neurovia
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ aadhar: 1 }, { unique: true })
db.predictions.createIndex({ user_id: 1 })
db.predictions.createIndex({ created_at: -1 })
```
