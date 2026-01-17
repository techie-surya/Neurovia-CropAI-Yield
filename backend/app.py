"""
Flask Backend for AgroAI Platform with MongoDB
Handles authentication, ML predictions, and database operations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_bcrypt import Bcrypt
from flask_compress import Compress
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId
import os
from pathlib import Path
from dotenv import load_dotenv
import joblib
import numpy as np
import pandas as pd
from datetime import datetime


# Paths
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables (root .env)
load_dotenv(ROOT_DIR / '.env')

# Model paths
MODEL_DIR = os.getenv('MODEL_DIR', str(BASE_DIR / 'models'))
PRODUCTION_DIR = os.path.join(MODEL_DIR, 'production')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Enable response compression for faster data transfer
Compress(app)

# Custom JSON encoder for ObjectId
from flask.json.provider import DefaultJSONProvider

class MongoDBJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if hasattr(o, 'isoformat'):
            return o.isoformat()
        return super().default(o)

app.json = MongoDBJSONProvider(app)

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/agroai')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# Initialize extensions
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB Connection
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    # Extract database name from URI or use default
    db_name = MONGODB_URI.split('/')[-1].split('?')[0] if '/' in MONGODB_URI else 'neurovia'
    db = client[db_name]
    
    # Test connection
    client.admin.command('ping')
    
    # Create collections if they don't exist
    if 'users' not in db.list_collection_names():
        db.create_collection('users')
    if 'predictions' not in db.list_collection_names():
        db.create_collection('predictions')
    
    # Create indexes
    db['users'].create_index('email', unique=True)
    db['users'].create_index('aadhar', unique=True)
    db['predictions'].create_index('user_id')
    db['predictions'].create_index('created_at')
    
    print("✓ MongoDB connected successfully!")
    USE_MOCK_DB = False
    
except Exception as e:
    print(f"✗ MongoDB connection error: {e}")
    print("⚠ Falling back to mock database (JSON files)...")
    from database import MockClient, MockMongoDB
    
    client = MockClient(MONGODB_URI)
    db_name = 'neurovia'
    db = client[db_name]
    USE_MOCK_DB = True
    print("✓ Mock database initialized successfully!")

# Load ML models (lazy load when needed)
models = {
    'yield_model': None,
    'yield_scaler': None,
    'crop_model': None,
    'crop_scaler': None,
    'crop_label_encoder': None,
    'risk_model': None,
    'risk_scaler': None,
    'risk_label_encoder': None
}

# Track if models are loaded to avoid redundant loads
models_loaded = False

def load_models():
    """Load pre-trained ML models"""
    global models, models_loaded
    def resolve(path_list):
        """Return first existing path from list"""
        for p in path_list:
            if os.path.exists(p):
                return p
        return None

    try:
        # Yield model (prefer production)
        yield_model_path = resolve([
            os.path.join(PRODUCTION_DIR, 'yield_model.pkl'),
            os.path.join(MODEL_DIR, 'yield_model.pkl')
        ])
        yield_scaler_path = resolve([
            os.path.join(PRODUCTION_DIR, 'yield_scaler.pkl'),
            os.path.join(MODEL_DIR, 'yield_scaler.pkl')
        ])
        if yield_model_path and yield_scaler_path:
            try:
                models['yield_model'] = joblib.load(yield_model_path)
                models['yield_scaler'] = joblib.load(yield_scaler_path)
                print(f"✓ Yield model loaded from {yield_model_path}")
            except Exception as e:
                print(f"⚠ Failed to load yield model: {e}")

        # Crop model (prefer production)
        crop_model_path = resolve([
            os.path.join(PRODUCTION_DIR, 'crop_model.pkl'),
            os.path.join(MODEL_DIR, 'crop_model.pkl')
        ])
        crop_scaler_path = resolve([
            os.path.join(PRODUCTION_DIR, 'crop_scaler.pkl'),
            os.path.join(MODEL_DIR, 'crop_scaler.pkl')
        ])
        crop_encoder_path = resolve([
            os.path.join(PRODUCTION_DIR, 'crop_label_encoder.pkl'),
            os.path.join(MODEL_DIR, 'crop_label_encoder.pkl')
        ])
        if crop_model_path and crop_scaler_path and crop_encoder_path:
            try:
                models['crop_model'] = joblib.load(crop_model_path)
                models['crop_scaler'] = joblib.load(crop_scaler_path)
                models['crop_label_encoder'] = joblib.load(crop_encoder_path)
                print(f"✓ Crop model loaded from {crop_model_path}")
            except Exception as e:
                print(f"⚠ Failed to load crop model: {e}")

        # Risk model (currently synthetic)
        risk_model_path = resolve([
            os.path.join(PRODUCTION_DIR, 'risk_model.pkl'),
            os.path.join(MODEL_DIR, 'risk_model.pkl')
        ])
        risk_scaler_path = resolve([
            os.path.join(PRODUCTION_DIR, 'risk_scaler.pkl'),
            os.path.join(MODEL_DIR, 'risk_scaler.pkl')
        ])
        risk_encoder_path = resolve([
            os.path.join(PRODUCTION_DIR, 'risk_label_encoder.pkl'),
            os.path.join(MODEL_DIR, 'risk_label_encoder.pkl')
        ])
        if risk_model_path and risk_scaler_path and risk_encoder_path:
            try:
                models['risk_model'] = joblib.load(risk_model_path)
                models['risk_scaler'] = joblib.load(risk_scaler_path)
                models['risk_label_encoder'] = joblib.load(risk_encoder_path)
                print(f"✓ Risk model loaded from {risk_model_path}")
            except Exception as e:
                print(f"⚠ Failed to load risk model: {e}")

        # Check if any model is missing
        loaded_models = [k for k, v in models.items() if '_model' in k and v is not None]
        if len(loaded_models) == 0:
            print("⚠ No ML models loaded. Using mock predictions for all endpoints.")
        elif len(loaded_models) < 3:
            print(f"⚠ Only {len(loaded_models)}/3 models loaded. Using mock fallback for missing models.")
        else:
            print("✓ All ML models loaded successfully.")
            
        # Mark models as loaded regardless of which ones succeeded
        models_loaded = True
            
    except Exception as e:
        print(f"⚠ Critical error in load_models: {e}")
        print("⚠ Using mock predictions as fallback.")
        models_loaded = False

# Crop mapping
CROP_MAPPING = {
    'rice': 0, 'wheat': 1, 'corn': 2, 'cotton': 3,
    'sugarcane': 4, 'soybean': 5, 'potato': 6, 'tomato': 7
}
CROP_REVERSE = {v: k for k, v in CROP_MAPPING.items()}

# ============================================
# HELPER FUNCTIONS
# ============================================

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(password_hash, password):
    """Check password against hash"""
    return bcrypt.check_password_hash(password_hash, password)

def user_to_dict(user):
    """Convert MongoDB user document to dictionary"""
    if not user:
        return None
    user['id'] = str(user['_id'])
    del user['_id']
    del user['password_hash']  # Never return password hash
    return user

def prediction_to_dict(prediction):
    """Convert MongoDB prediction document to dictionary, converting ObjectIds to strings"""
    if not prediction:
        return None
    
    # Convert main _id to id
    prediction['id'] = str(prediction['_id'])
    del prediction['_id']
    
    # Convert user_id if it's an ObjectId
    if 'user_id' in prediction and isinstance(prediction['user_id'], ObjectId):
        prediction['user_id'] = str(prediction['user_id'])
    
    # Convert created_at to ISO format if it exists
    if 'created_at' in prediction and hasattr(prediction['created_at'], 'isoformat'):
        prediction['created_at'] = prediction['created_at'].isoformat()
    
    return prediction


# ============================================
# MONITORING HELPERS
# ============================================

def evaluate_yield_model():
    if not models['yield_model'] or not models['yield_scaler']:
        return None

    test_path = BASE_DIR / 'data' / 'splits' / 'test_yield.csv'
    if not test_path.exists():
        return None

    df = pd.read_csv(test_path)
    feature_candidates = ['rainfall', 'temperature', 'pesticides']
    features = [c for c in feature_candidates if c in df.columns]
    target = 'yield'
    if target not in df.columns or not features:
        return None

    X = df[features].values
    y = df[target].values

    scaler = models['yield_scaler']
    model = models['yield_model']

    X_scaled = scaler.transform(X)
    preds = model.predict(X_scaled)

    rmse = float(np.sqrt(np.mean((y - preds) ** 2)))
    mae = float(np.mean(np.abs(y - preds)))
    r2 = float(1 - np.sum((y - preds) ** 2) / np.sum((y - np.mean(y)) ** 2))

    return {
        'samples': len(df),
        'features_used': features,
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
    }


def evaluate_crop_model():
    if not models['crop_model'] or not models['crop_scaler'] or not models['crop_label_encoder']:
        return None

    test_path = BASE_DIR / 'data' / 'splits' / 'test_crop.csv'
    if not test_path.exists():
        return None

    df = pd.read_csv(test_path)
    feature_candidates = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'ph', 'rainfall', 'npk_ratio']
    features = [c for c in feature_candidates if c in df.columns]
    target = 'crop'
    if target not in df.columns or not features:
        return None

    X = df[features].values
    y = df[target].values

    scaler = models['crop_scaler']
    encoder = models['crop_label_encoder']
    model = models['crop_model']

    X_scaled = scaler.transform(X)
    y_enc = encoder.transform(y)
    preds = model.predict(X_scaled)

    acc = float(np.mean(preds == y_enc))

    return {
        'samples': len(df),
        'features_used': features,
        'classes': encoder.classes_.tolist(),
        'accuracy': acc,
    }

# Crop mapping
CROP_MAPPING = {
    'rice': 0, 'wheat': 1, 'corn': 2, 'cotton': 3,
    'sugarcane': 4, 'soybean': 5, 'potato': 6, 'tomato': 7
}
CROP_REVERSE = {v: k for k, v in CROP_MAPPING.items()}

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        if not data.get('aadhar'):
            return jsonify({'error': 'Aadhar is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
        
        # Check if user exists
        if db['users'].find_one({'email': data['email']}):
            return jsonify({'error': 'Email already registered'}), 400
        
        if db['users'].find_one({'aadhar': data['aadhar']}):
            return jsonify({'error': 'Aadhar already registered'}), 400
        
        # Create new user
        user_doc = {
            'name': data['name'],
            'email': data['email'],
            'aadhar': data['aadhar'],
            'password_hash': hash_password(data['password']),
            'created_at': datetime.utcnow()
        }
        
        result = db['users'].insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        
        # Create JWT token
        access_token = create_access_token(identity=str(result.inserted_id))
        
        return jsonify({
            'message': 'Registration successful',
            'user': user_to_dict(user_doc),
            'access_token': access_token
        }), 201
        
    except DuplicateKeyError:
        return jsonify({'error': 'Email or Aadhar already registered'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email/Aadhar and password required'}), 400
        
        # Find user by email OR aadhar (since frontend sends aadhar as email field)
        # Check if it's a 12-digit number (Aadhar) or email format
        identifier = data['email']
        if identifier.isdigit() and len(identifier) == 12:
            # It's an Aadhar number
            user = db['users'].find_one({'aadhar': identifier})
        else:
            # It's an email or mobile number
            user = db['users'].find_one({'email': identifier})
        
        if not user or not check_password(user['password_hash'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create JWT token
        access_token = create_access_token(identity=str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'user': user_to_dict(user),
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        user = db['users'].find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user_to_dict(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile (CRUD - Update)"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Find user
        user = db['users'].find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed fields
        update_fields = {}
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'email' in data:
            # Check if email already exists (and is not same user)
            existing = db['users'].find_one({'email': data['email']})
            if existing and str(existing['_id']) != user_id:
                return jsonify({'error': 'Email already in use'}), 400
            update_fields['email'] = data['email']
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        # Update in database
        db['users'].update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        # Get updated user
        updated_user = db['users'].find_one({'_id': ObjectId(user_id)})
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_to_dict(updated_user)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('old_password') or not data.get('new_password'):
            return jsonify({'error': 'Old and new password required'}), 400
        
        # Find user
        user = db['users'].find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify old password
        if not check_password(user['password_hash'], data['old_password']):
            return jsonify({'error': 'Invalid old password'}), 401
        
        # Update password
        new_hash = hash_password(data['new_password'])
        db['users'].update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password_hash': new_hash}}
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete user account (CRUD - Delete)"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        
        # Delete user
        result = db['users'].delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Also delete all predictions for this user
        db['predictions'].delete_many({'user_id': ObjectId(user_id)})
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user (frontend clears token)"""
    return jsonify({'message': 'Logged out successfully'}), 200


# ============================================
# ML PREDICTION ROUTES
# ============================================

@app.route('/api/predict-yield', methods=['POST'])
def predict_yield():
    """Predict crop yield - works for both guests and logged-in users"""
    try:
        global models_loaded
        
        # Load models only once
        if not models_loaded:
            load_models()
        
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        
        # Try to verify JWT but don't fail if missing
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            user_id = None
        
        data = request.get_json()
        
        # Extract features for the trained model
        input_features = np.array([[
            data.get('rainfall', 1500),
            data.get('temperature', 25),
            data.get('nitrogen', 80),
            data.get('phosphorus', 50),
            data.get('potassium', 50),
            data.get('soil_moisture', 50),
            data.get('humidity', 65)
        ]])
        
        confidence = 0.85
        
        # Make prediction using trained model if available
        if models['yield_model'] is not None and models['yield_scaler'] is not None:
            try:
                # Scale input features
                input_scaled = models['yield_scaler'].transform(input_features)
                # Make prediction
                yield_pred = models['yield_model'].predict(input_scaled)[0]
                confidence = 0.92  # Higher confidence with trained model
            except Exception as model_error:
                print(f"Model prediction error: {model_error}")
                # Fallback to mock prediction
                yield_pred = np.random.normal(4500, 500)
        else:
            # Mock prediction when model not available
            yield_pred = np.random.normal(4500, 500)
            confidence = 0.70  # Lower confidence for mock
        
        yield_pred = max(1500, min(8000, yield_pred))  # Ensure reasonable range
        
        # Save to MongoDB only if user is logged in
        saved = False
        if user_id:
            prediction_doc = {
                'user_id': ObjectId(user_id),
                'prediction_type': 'yield',
                'input_data': {
                    'rainfall': data.get('rainfall'),
                    'temperature': data.get('temperature'),
                    'nitrogen': data.get('nitrogen'),
                    'phosphorus': data.get('phosphorus'),
                    'potassium': data.get('potassium'),
                    'soil_moisture': data.get('soil_moisture'),
                    'humidity': data.get('humidity')
                },
                'output_data': {'yield': float(yield_pred), 'confidence': confidence},
                'model_type': 'trained' if models['yield_model'] else 'mock',
                'created_at': datetime.utcnow()
            }
            result = db['predictions'].insert_one(prediction_doc)
            
            # Update user's prediction count
            db['users'].update_one(
                {'_id': ObjectId(user_id)},
                {'$inc': {'total_predictions': 1}}
            )
            saved = True
        
        return jsonify({
            'yield': round(float(yield_pred), 2),
            'unit': 'kg/hectare',
            'confidence': round(confidence, 2),
            'model_status': 'Trained Model' if models['yield_model'] else 'Mock Model',
            'saved': saved,
            'message': 'Prediction saved to your profile' if saved else 'Login to save predictions'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/monitor', methods=['GET'])
def monitor_models():
    """Return evaluation metrics for production models"""
    try:
        # Ensure models are loaded
        if not any(models.values()):
            load_models()

        yield_metrics = evaluate_yield_model()
        crop_metrics = evaluate_crop_model()

        if not yield_metrics and not crop_metrics:
            return jsonify({'error': 'No models available for monitoring'}), 404

        return jsonify({
            'yield_model': yield_metrics,
            'crop_model': crop_metrics,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict-crop', methods=['POST'])
def predict_crop():
    """Recommend crop - works for both guests and logged-in users"""
    try:
        global models_loaded
        
        # Load models only once
        if not models_loaded:
            load_models()
        
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        
        # Try to verify JWT but don't fail if missing
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            user_id = None
        
        data = request.get_json()
        
        # Extract features matching the trained production model
        # Expected features: nitrogen, phosphorus, potassium, temperature, ph, rainfall, npk_ratio
        nitrogen = data.get('nitrogen', 80)
        phosphorus = data.get('phosphorus', 40)
        potassium = data.get('potassium', 40)
        temperature = data.get('temperature', 25)
        ph = data.get('ph', 7.0)
        rainfall = data.get('rainfall', 1200)
        npk_ratio = data.get('npk_ratio')
        if npk_ratio is None:
            # Derive a simple NPK ratio feature if not provided
            npk_ratio = (nitrogen + phosphorus + potassium) / 3 if all(isinstance(v, (int, float)) for v in [nitrogen, phosphorus, potassium]) else 0.0

        # Log the received values for debugging
        print(f"Crop prediction input - N:{nitrogen} P:{phosphorus} K:{potassium} T:{temperature} pH:{ph} R:{rainfall} npk_ratio:{npk_ratio}")

        input_features = np.array([[nitrogen, phosphorus, potassium, temperature, ph, rainfall, npk_ratio]])
        model_error = None
        
        confidence = 0.80
        top_crops = []
        
        # Make prediction using trained model if available
        if models['crop_model'] is not None and models['crop_scaler'] is not None and models['crop_label_encoder'] is not None:
            try:
                # Scale input features
                input_scaled = models['crop_scaler'].transform(input_features)
                # Make prediction
                crop_pred_encoded = models['crop_model'].predict(input_scaled)[0]
                crop_pred_proba = models['crop_model'].predict_proba(input_scaled)[0]
                
                # Decode crop name
                crop_name = models['crop_label_encoder'].inverse_transform([int(crop_pred_encoded)])[0]
                confidence = max(crop_pred_proba) * 0.95  # Get probability of predicted class
                
                # Get top 3 predictions
                top_indices = np.argsort(crop_pred_proba)[::-1][:3]
                top_crops = [
                    {
                        'crop': models['crop_label_encoder'].inverse_transform([i])[0],
                        'confidence': round(float(crop_pred_proba[i]), 3)
                    }
                    for i in top_indices
                ]
                
            except Exception as model_error:
                model_error = str(model_error)
                print(f"Crop model prediction error: {model_error}")
                # Fallback to mock
                crop_name = 'rice'
                confidence = 0.70
                top_crops = [
                    {'crop': 'rice', 'confidence': 0.70},
                    {'crop': 'wheat', 'confidence': 0.20},
                    {'crop': 'maize', 'confidence': 0.10}
                ]
        else:
            # Mock prediction when model not available
            crops = ['rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'soybean']
            crop_name = np.random.choice(crops)
            confidence = np.random.uniform(0.6, 0.85)
            top_crops = [
                {'crop': np.random.choice(crops), 'confidence': round(np.random.uniform(0.5, 0.9), 3)}
                for _ in range(3)
            ]
        
        # Save to MongoDB only if user is logged in
        saved = False
        if user_id:
            prediction_doc = {
                'user_id': ObjectId(user_id),
                'prediction_type': 'crop',
                'input_data': {
                    'nitrogen': nitrogen,
                    'phosphorus': phosphorus,
                    'potassium': potassium,
                    'temperature': temperature,
                    'ph': ph,
                    'rainfall': rainfall
                },
                'output_data': {'crop': crop_name, 'confidence': confidence},
                'model_type': 'trained' if models['crop_model'] else 'mock',
                'created_at': datetime.utcnow()
            }
            result = db['predictions'].insert_one(prediction_doc)
            
            # Update user's prediction count
            db['users'].update_one(
                {'_id': ObjectId(user_id)},
                {'$inc': {'total_predictions': 1}}
            )
            saved = True
        
        return jsonify({
            'recommended_crop': crop_name,
            'confidence': round(confidence, 3),
            'model_status': 'Trained Model' if models['crop_model'] else 'Mock Model',
            'debug_input': {
                'nitrogen': nitrogen,
                'phosphorus': phosphorus,
                'potassium': potassium,
                'temperature': temperature,
                'ph': ph,
                'rainfall': rainfall
            },
            'model_error': model_error,
            'top_3': top_crops if top_crops else [
                {'crop': 'rice', 'confidence': 0.70},
                {'crop': 'wheat', 'confidence': 0.20},
                {'crop': 'maize', 'confidence': 0.10}
            ],
            'saved': saved,
            'message': 'Prediction saved to your profile' if saved else 'Login to save predictions'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    """Predict farming risk with enhanced features - works for both guests and logged-in users"""
    try:
        global models_loaded
        
        # Load models only once
        if not models_loaded:
            load_models()
        
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        
        # Try to verify JWT but don't fail if missing
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            user_id = None
        
        data = request.get_json()
        
        # Extract enhanced features for the trained model
        # Feature order: temperature, humidity, rainfall, crop_age, soil_moisture, nitrogen, phosphorus, potassium, soil_ph, soil_drainage
        input_features = np.array([[
            data.get('temperature', 25),
            data.get('humidity', 65),
            data.get('rainfall', 100),
            data.get('crop_age', 50),
            data.get('soil_moisture', 50),
            data.get('nitrogen', 80),
            data.get('phosphorus', 40),
            data.get('potassium', 40),
            data.get('soil_ph', 7.0),
            data.get('soil_drainage', 75)
        ]])
        
        confidence = 0.80
        
        # Make prediction using trained model if available
        if models['risk_model'] is not None and models['risk_scaler'] is not None and models['risk_label_encoder'] is not None:
            try:
                # Scale input features
                input_scaled = models['risk_scaler'].transform(input_features)
                # Make prediction
                risk_pred_encoded = models['risk_model'].predict(input_scaled)[0]
                risk_pred_proba = models['risk_model'].predict_proba(input_scaled)[0]
                
                # Decode risk level
                risk_name = models['risk_label_encoder'].inverse_transform([int(risk_pred_encoded)])[0]
                confidence = max(risk_pred_proba) * 0.95
                
            except Exception as model_error:
                print(f"Risk model prediction error: {model_error}")
                # Fallback to enhanced mock logic
                risk_score = 0
                
                # Assess from input parameters
                temp_diff = abs(data.get('temperature', 25) - 28)
                if temp_diff > 8:
                    risk_score += 30
                elif temp_diff > 5:
                    risk_score += 15
                
                if data.get('humidity', 65) > 80:
                    risk_score += 20
                
                rainfall = data.get('rainfall', 100)
                if rainfall < 50:
                    risk_score += 25
                elif rainfall > 200:
                    risk_score += 20
                
                if data.get('nitrogen', 80) < 50:
                    risk_score += 20
                if data.get('potassium', 40) < 30:
                    risk_score += 25
                
                if risk_score > 70:
                    risk_name = 'high'
                elif risk_score > 40:
                    risk_name = 'medium'
                else:
                    risk_name = 'low'
                confidence = 0.75
        else:
            # Mock prediction when model not available with better logic
            risk_score = 0
            temp_diff = abs(data.get('temperature', 25) - 28)
            if temp_diff > 10:
                risk_score += 35
            elif temp_diff > 5:
                risk_score += 15
            
            humidity = data.get('humidity', 65)
            if humidity > 85:
                risk_score += 25
            elif humidity > 75:
                risk_score += 12
            
            rainfall = data.get('rainfall', 100)
            if rainfall < 40:
                risk_score += 30
            elif rainfall < 60:
                risk_score += 15
            elif rainfall > 200:
                risk_score += 25
            
            nitrogen = data.get('nitrogen', 80)
            if nitrogen < 40:
                risk_score += 20
            
            potassium = data.get('potassium', 40)
            if potassium < 30:
                risk_score += 25
            
            soil_drainage = data.get('soil_drainage', 75)
            if soil_drainage < 50:
                risk_score += 20
            
            if risk_score > 70:
                risk_name = 'high'
            elif risk_score > 40:
                risk_name = 'medium'
            else:
                risk_name = 'low'
            confidence = 0.72
        
        # Capitalize for display
        risk_display = risk_name.capitalize()
        
        # Save to MongoDB only if user is logged in
        saved = False
        if user_id:
            prediction_doc = {
                'user_id': ObjectId(user_id),
                'prediction_type': 'risk',
                'input_data': {
                    'temperature': data.get('temperature'),
                    'humidity': data.get('humidity'),
                    'rainfall': data.get('rainfall'),
                    'crop_age': data.get('crop_age'),
                    'soil_moisture': data.get('soil_moisture'),
                    'nitrogen': data.get('nitrogen'),
                    'phosphorus': data.get('phosphorus'),
                    'potassium': data.get('potassium'),
                    'soil_ph': data.get('soil_ph'),
                    'soil_drainage': data.get('soil_drainage')
                },
                'output_data': {'risk_level': risk_display, 'confidence': confidence},
                'model_type': 'trained' if models['risk_model'] else 'mock',
                'created_at': datetime.utcnow()
            }
            result = db['predictions'].insert_one(prediction_doc)
            
            # Update user's prediction count
            db['users'].update_one(
                {'_id': ObjectId(user_id)},
                {'$inc': {'total_predictions': 1}}
            )
            saved = True
        
        return jsonify({
            'risk_level': risk_display,
            'confidence': round(confidence, 2),
            'model_status': 'Enhanced Trained Model' if models['risk_model'] else 'Enhanced Mock Model',
            'recommendations': get_risk_recommendations(risk_display),
            'saved': saved,
            'message': 'Prediction saved to your profile' if saved else 'Login to save predictions'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_risk_recommendations(risk_level):
    """Get recommendations based on risk level"""
    recommendations = {
        'Low': ['Continue current farming practices', 'Monitor soil health regularly'],
        'Medium': ['Improve irrigation system', 'Consider crop rotation', 'Monitor pest activity'],
        'High': ['Urgent soil testing required', 'Change crop variety', 'Consult agricultural officer', 'Consider insurance']
    }
    return recommendations.get(risk_level, [])


# ============================================
# UTILITY ROUTES
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        client.admin.command('ping')
        return jsonify({
            'status': 'healthy',
            'message': 'AgroAI Platform API is running',
            'database': 'MongoDB connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': 'Database connection error',
            'error': str(e)
        }), 500


@app.route('/api/prediction-history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    """Get user's prediction history with optional filtering"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        
        # Optional query parameters
        prediction_type = request.args.get('type')  # 'yield', 'crop', or 'risk'
        limit = request.args.get('limit', default=100, type=int)
        
        # Build query
        query = {'user_id': ObjectId(user_id)}
        if prediction_type:
            query['prediction_type'] = prediction_type
        
        # Get predictions
        predictions = list(db['predictions'].find(query).sort('created_at', -1).limit(limit))
        
        # Group by type for summary
        summary = {}
        for p in predictions:
            ptype = p.get('prediction_type')
            summary[ptype] = summary.get(ptype, 0) + 1
        
        return jsonify({
            'count': len(predictions),
            'summary': summary,
            'predictions': [prediction_to_dict(p) for p in predictions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics - shows aggregate stats for public, personal stats for logged-in users"""
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
    
    try:
        # Try to get JWT to check if user is logged in
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass
        
        # If user is logged in, return personal dashboard
        if user_id:
            return get_personal_dashboard(user_id)
        else:
            return get_aggregate_dashboard()
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_aggregate_dashboard():
    """Get aggregate statistics for non-logged-in users - OPTIMIZED with aggregation pipeline"""
    try:
        # Use MongoDB aggregation pipeline instead of loading all data
        stats_pipeline = [
            {
                '$facet': {
                    'total_count': [{'$count': 'count'}],
                    'yield_stats': [
                        {'$match': {'prediction_type': 'yield'}},
                        {'$group': {
                            '_id': None,
                            'avg_yield': {'$avg': '$output_data.yield'},
                            'count': {'$sum': 1}
                        }}
                    ],
                    'high_confidence': [
                        {'$match': {'output_data.confidence': {'$gte': 0.70}}},
                        {'$count': 'count'}
                    ]
                }
            }
        ]
        
        result = list(db['predictions'].aggregate(stats_pipeline))[0]
        
        # Extract results safely
        total_predictions = result['total_count'][0]['count'] if result['total_count'] else 0
        avg_yield = round(result['yield_stats'][0]['avg_yield'], 2) if result['yield_stats'] else 0
        high_conf_count = result['high_confidence'][0]['count'] if result['high_confidence'] else 0
        success_rate = (high_conf_count / total_predictions * 100) if total_predictions > 0 else 0
        
        # Count users (simple count is fast)
        total_farmers = db['users'].count_documents({})
        
        return jsonify({
            'type': 'aggregate',
            'total_predictions': total_predictions,
            'avg_yield': avg_yield,
            'success_rate': round(success_rate, 0),
            'active_farmers': total_farmers,
            'message': 'Community statistics - Log in to see your personal predictions'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_personal_dashboard(user_id):
    """Get personal dashboard statistics for logged-in users - OPTIMIZED"""
    try:
        user_oid = ObjectId(user_id)
        
        # Get user info
        user = db['users'].find_one({'_id': user_oid}, {'name': 1, 'email': 1, 'created_at': 1})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get year prediction summary
        from datetime import datetime
        current_year = datetime.utcnow().year
        year_start = datetime(current_year, 1, 1)
        
        # Use aggregation pipeline for all calculations
        stats_pipeline = [
            {'$match': {'user_id': user_oid}},
            {
                '$facet': {
                    'total_all_time': [{'$count': 'count'}],
                    'year_stats': [
                        {'$match': {'created_at': {'$gte': year_start}}},
                        {
                            '$group': {
                                '_id': '$prediction_type',
                                'count': {'$sum': 1},
                                'avg_yield': {
                                    '$avg': {
                                        '$cond': [
                                            {'$eq': ['$prediction_type', 'yield']},
                                            '$output_data.yield',
                                            None
                                        ]
                                    }
                                },
                                'success_count': {
                                    '$sum': {
                                        '$cond': [
                                            {'$gte': ['$output_data.confidence', 0.70]},
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    'crop_distribution': [
                        {'$match': {'prediction_type': 'crop', 'created_at': {'$gte': year_start}}},
                        {'$group': {
                            '_id': '$output_data.crop',
                            'count': {'$sum': 1}
                        }},
                        {'$sort': {'count': -1}}
                    ],
                    'recent_10': [
                        {'$sort': {'created_at': -1}},
                        {'$limit': 10},
                        {'$project': {
                            '_id': 1,
                            'prediction_type': 1,
                            'output_data': 1,
                            'created_at': 1
                        }}
                    ]
                }
            }
        ]
        
        result = list(db['predictions'].aggregate(stats_pipeline))[0]
        
        # Process results
        total_all_time = result['total_all_time'][0]['count'] if result['total_all_time'] else 0
        
        year_data = {}
        total_year = 0
        avg_yield = 0
        success_count = 0
        
        for stat in result['year_stats']:
            pred_type = stat['_id']
            year_data[pred_type] = stat['count']
            total_year += stat['count']
            if stat['avg_yield']:
                avg_yield = stat['avg_yield']
            success_count += stat['success_count']
        
        success_rate = (success_count / total_year * 100) if total_year > 0 else 0
        
        # Build crop recommendations dict
        crop_recommendations = {c['_id']: c['count'] for c in result['crop_distribution']}
        top_crop = result['crop_distribution'][0]['_id'] if result['crop_distribution'] else 'N/A'
        
        # Convert recent predictions
        recent_predictions = [prediction_to_dict(p) for p in result['recent_10']]
        
        return jsonify({
            'type': 'personal',
            'user': {
                'name': user.get('name'),
                'email': user.get('email'),
                'created_at': user.get('created_at').isoformat() if user.get('created_at') else None
            },
            'year_summary': {
                'year': current_year,
                'total_predictions': total_year,
                'yield_predictions': year_data.get('yield', 0),
                'crop_predictions': year_data.get('crop', 0),
                'risk_predictions': year_data.get('risk', 0)
            },
            'statistics': {
                'avg_yield': round(avg_yield, 2),
                'top_crop': top_crop,
                'crop_count': len(crop_recommendations),
                'success_rate': round(success_rate, 1),
                'total_predictions_all_time': total_all_time
            },
            'crop_recommendations': crop_recommendations,
            'recent_predictions': recent_predictions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/save-detailed-prediction', methods=['POST'])
@jwt_required()
def save_detailed_prediction():
    """Save detailed prediction with location, land area, season, etc."""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Create detailed prediction record
        prediction_doc = {
            'user_id': ObjectId(user_id),
            'prediction_type': 'yield_detailed',
            'crop_type': data.get('cropType'),
            'season': data.get('season'),
            'location': data.get('location'),
            'region': data.get('region'),
            'land_area': data.get('landArea'),
            'land_area_unit': data.get('landAreaUnit'),
            'soil_parameters': {
                'ph': data.get('soilPH'),
                'nitrogen': data.get('nitrogen'),
                'phosphorus': data.get('phosphorus'),
                'potassium': data.get('potassium'),
                'moisture': data.get('soilMoisture')
            },
            'weather_parameters': {
                'temperature': data.get('temperature'),
                'humidity': data.get('humidity'),
                'rainfall': data.get('rainfall')
            },
            'prediction_result': data.get('result', {}),
            'created_at': datetime.utcnow()
        }
        
        result = db['predictions'].insert_one(prediction_doc)
        
        # Update user stats
        db['users'].update_one(
            {'_id': ObjectId(user_id)},
            {
                '$inc': {'total_predictions': 1},
                '$addToSet': {
                    'crops': data.get('cropType'),
                    'regions': data.get('region')
                }
            }
        )
        
        return jsonify({
            'success': True,
            'prediction_id': str(result.inserted_id),
            'message': 'Detailed prediction saved successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predictions/filters', methods=['GET'])
@jwt_required()
def get_predictions_with_filters():
    """Get predictions with advanced filtering (crop, date range, season, location, revenue)"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get filter parameters
        crop = request.args.get('crop')
        season = request.args.get('season')
        location = request.args.get('location')
        region = request.args.get('region')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        min_revenue = request.args.get('min_revenue', type=float)
        max_revenue = request.args.get('max_revenue', type=float)
        
        # Build base query for user
        query = {'user_id': ObjectId(user_id)}
        
        # Add date range filter if specified
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                date_query['$lte'] = datetime.fromisoformat(end_date)
            query['created_at'] = date_query
        
        # Get all predictions for the user
        all_predictions = list(db['predictions'].find(query).sort('created_at', -1))
        
        # Format and filter predictions
        formatted = []
        for pred in all_predictions:
            prediction_type = pred.get('prediction_type', '')
            
            # Handle detailed predictions (from EnhancedPredictionForm)
            if prediction_type == 'yield_detailed':
                crop_type = pred.get('crop_type', 'Unknown')
                pred_season = pred.get('season', 'Unknown')
                pred_location = pred.get('location', 'Unknown')
                pred_region = pred.get('region', 'Unknown')
                land_area = pred.get('land_area', 0)
                land_area_unit = pred.get('land_area_unit', 'acres')
                pred_yield = pred.get('prediction_result', {}).get('yield', 0)
                pred_revenue = pred.get('prediction_result', {}).get('revenue', 0)
                pred_confidence = pred.get('prediction_result', {}).get('confidence', 0)
            
            # Handle basic predictions (from YieldPrediction, CropRecommendation, etc)
            else:
                crop_type = pred.get('crop_type', 'Mixed')
                pred_season = pred.get('season', 'All Seasons')
                pred_location = pred.get('location', 'Various Locations')
                pred_region = pred.get('region', 'Multiple Regions')
                land_area = 1
                land_area_unit = 'acre'
                
                # Extract yield from different possible locations
                if 'output_data' in pred:
                    pred_yield = pred['output_data'].get('yield', 0)
                    pred_confidence = pred['output_data'].get('confidence', 0)
                    # Estimate revenue (₹20 per kg average)
                    pred_revenue = pred_yield * 20
                else:
                    pred_yield = pred.get('prediction_result', {}).get('yield', 0)
                    pred_revenue = pred.get('prediction_result', {}).get('revenue', 0)
                    pred_confidence = pred.get('prediction_result', {}).get('confidence', 0)
            
            # Apply filters
            if crop and crop != crop_type:
                continue
            if season and season != pred_season:
                continue
            if location and location.lower() not in pred_location.lower():
                continue
            if region and region != pred_region:
                continue
            if min_revenue and pred_revenue < min_revenue:
                continue
            if max_revenue and pred_revenue > max_revenue:
                continue
            
            formatted.append({
                'id': str(pred['_id']),
                'crop_type': crop_type,
                'season': pred_season,
                'location': pred_location,
                'region': pred_region,
                'land_area': land_area,
                'land_area_unit': land_area_unit,
                'yield': pred_yield,
                'revenue': pred_revenue,
                'confidence': pred_confidence,
                'date': pred['created_at'].isoformat(),
                'formatted_date': pred['created_at'].strftime('%B %d, %Y')
            })
        
        return jsonify({
            'count': len(formatted),
            'predictions': formatted
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# PREDICTION HISTORY & ANALYTICS
# ============================================

@app.route('/api/profile/predictions', methods=['GET'])
@jwt_required()
def get_user_predictions():
    """Get user's prediction history with dates"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        prediction_type = request.args.get('type', 'all')  # all, yield, crop, risk
        
        # Build query
        query = {'user_id': ObjectId(user_id)}
        if prediction_type != 'all':
            query['prediction_type'] = prediction_type
        
        # Get total count
        total_count = db['predictions'].count_documents(query)
        
        # Get predictions with pagination
        predictions = list(db['predictions'].find(query)
                          .sort('created_at', -1)
                          .skip((page - 1) * limit)
                          .limit(limit))
        
        # Format predictions
        formatted_predictions = []
        for pred in predictions:
            formatted_predictions.append({
                'id': str(pred['_id']),
                'type': pred['prediction_type'],
                'input_data': pred['input_data'],
                'output_data': pred['output_data'],
                'model_type': pred.get('model_type', 'unknown'),
                'date': pred['created_at'].isoformat(),
                'formatted_date': pred['created_at'].strftime('%B %d, %Y at %I:%M %p')
            })
        
        return jsonify({
            'predictions': formatted_predictions,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/yearly', methods=['GET'])
@jwt_required()
def get_yearly_analytics():
    """Get yearly analytics for logged-in user"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        # Get year parameter (default to current year)
        year = int(request.args.get('year', datetime.utcnow().year))
        
        # Get all predictions for the year
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)
        
        predictions = list(db['predictions'].find({
            'user_id': ObjectId(user_id),
            'created_at': {'$gte': start_date, '$lt': end_date}
        }).sort('created_at', 1))
        
        # Monthly breakdown
        monthly_data = {i: {'yield': 0, 'crop': 0, 'risk': 0, 'total': 0} for i in range(1, 13)}
        
        total_yield = 0
        yield_count = 0
        crop_distribution = {}
        risk_distribution = {'Low': 0, 'Medium': 0, 'High': 0}
        
        for pred in predictions:
            month = pred['created_at'].month
            pred_type = pred['prediction_type']
            monthly_data[month][pred_type] += 1
            monthly_data[month]['total'] += 1
            
            if pred_type == 'yield':
                yield_val = pred['output_data'].get('yield', 0)
                total_yield += yield_val
                yield_count += 1
            elif pred_type == 'crop':
                crop = pred['output_data'].get('crop', 'Unknown')
                crop_distribution[crop] = crop_distribution.get(crop, 0) + 1
            elif pred_type == 'risk':
                risk = pred['output_data'].get('risk_level', 'Low')
                risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
        
        # Calculate quarterly data
        quarterly_data = {
            'Q1': sum(monthly_data[m]['total'] for m in [1, 2, 3]),
            'Q2': sum(monthly_data[m]['total'] for m in [4, 5, 6]),
            'Q3': sum(monthly_data[m]['total'] for m in [7, 8, 9]),
            'Q4': sum(monthly_data[m]['total'] for m in [10, 11, 12])
        }
        
        # Calculate estimated revenue (assuming avg price per kg)
        avg_yield = total_yield / yield_count if yield_count > 0 else 0
        avg_price_per_kg = 25  # Example price in currency units
        estimated_revenue = avg_yield * avg_price_per_kg if avg_yield > 0 else 0
        
        return jsonify({
            'year': year,
            'summary': {
                'total_predictions': len(predictions),
                'avg_yield': round(avg_yield, 2),
                'estimated_revenue': round(estimated_revenue, 2),
                'currency': 'INR'
            },
            'monthly_breakdown': monthly_data,
            'quarterly_breakdown': quarterly_data,
            'crop_distribution': crop_distribution,
            'risk_distribution': risk_distribution
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/quarterly', methods=['GET'])
@jwt_required()
def get_quarterly_analytics():
    """Get quarterly analytics for logged-in user"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        year = int(request.args.get('year', datetime.utcnow().year))
        quarter = int(request.args.get('quarter', ((datetime.utcnow().month - 1) // 3) + 1))  # 1-4
        
        # Determine quarter date range
        quarter_start_month = (quarter - 1) * 3 + 1
        start_date = datetime(year, quarter_start_month, 1)
        
        if quarter == 4:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, quarter_start_month + 3, 1)
        
        predictions = list(db['predictions'].find({
            'user_id': ObjectId(user_id),
            'created_at': {'$gte': start_date, '$lt': end_date}
        }))
        
        # Calculate metrics
        total_yield = 0
        yield_count = 0
        crops = []
        
        for pred in predictions:
            if pred['prediction_type'] == 'yield':
                yield_val = pred['output_data'].get('yield', 0)
                total_yield += yield_val
                yield_count += 1
            elif pred['prediction_type'] == 'crop':
                crops.append(pred['output_data'].get('crop', 'Unknown'))
        
        avg_yield = total_yield / yield_count if yield_count > 0 else 0
        avg_price_per_kg = 25
        revenue = avg_yield * avg_price_per_kg
        
        return jsonify({
            'year': year,
            'quarter': f'Q{quarter}',
            'period': f'{start_date.strftime("%B %Y")} - {end_date.strftime("%B %Y")}',
            'total_predictions': len(predictions),
            'avg_yield': round(avg_yield, 2),
            'revenue': round(revenue, 2),
            'crops_recommended': list(set(crops)),
            'currency': 'INR'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# JWT ERROR HANDLERS
# ============================================

@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing JWT token - allow continuation for optional routes"""
    return jsonify({'error': 'Missing authorization token'}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid JWT token - allow continuation for optional routes"""
    return jsonify({'error': 'Invalid token'}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    """Handle expired JWT token"""
    return jsonify({'error': 'Token has expired'}), 401


# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ============================================
# INITIALIZATION
# ============================================

if __name__ == '__main__':
    # Load models
    load_models()
    
    print("\n" + "="*50)
    print("🚀 AgroAI Backend Server Starting...")
    print("="*50)
    print(f"📊 MongoDB: {MONGODB_URI}")
    print(f"🔐 JWT Enabled")
    print(f"⚙️ Flask Debug: {os.getenv('FLASK_DEBUG', 'False')}")
    print("="*50 + "\n")
    
    # Run server
    app.run(debug=True, host='0.0.0.0', port=5000)

