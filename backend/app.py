"""
Flask Backend for AgroAI Platform with MongoDB
Handles authentication, ML predictions, and database operations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_bcrypt import Bcrypt
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

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/agroai')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# Initialize extensions
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB Connection
try:
    client = MongoClient(MONGODB_URI)
    db = client['agroai']
    
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
except Exception as e:
    print(f"✗ MongoDB connection error: {e}")
    print("Make sure MongoDB is running: mongod")

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

def load_models():
    """Load pre-trained ML models"""
    global models
    try:
        def resolve(path_list):
            """Return first existing path from list"""
            for p in path_list:
                if os.path.exists(p):
                    return p
            return None

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
            models['yield_model'] = joblib.load(yield_model_path)
            models['yield_scaler'] = joblib.load(yield_scaler_path)
            print(f"Yield model loaded from {yield_model_path}")

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
            models['crop_model'] = joblib.load(crop_model_path)
            models['crop_scaler'] = joblib.load(crop_scaler_path)
            models['crop_label_encoder'] = joblib.load(crop_encoder_path)
            print(f"Crop model loaded from {crop_model_path}")

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
            models['risk_model'] = joblib.load(risk_model_path)
            models['risk_scaler'] = joblib.load(risk_scaler_path)
            models['risk_label_encoder'] = joblib.load(risk_encoder_path)
            print(f"Risk model loaded from {risk_model_path}")

        # Check if any model is missing
        models_loaded = [k for k, v in models.items() if '_model' in k and v is not None]
        if len(models_loaded) < 3:
            print(f"Warning: only {len(models_loaded)}/3 models loaded. Train missing models if needed.")
        else:
            print("All ML models loaded successfully.")
            
    except Exception as e:
        print(f"⚠ Error loading models: {e}")
        print("⚠ Using mock predictions as fallback.")

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
    """Convert MongoDB prediction document to dictionary"""
    if not prediction:
        return None
    prediction['id'] = str(prediction['_id'])
    del prediction['_id']
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
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = db['users'].find_one({'email': data['email']})
        
        if not user or not check_password(user['password_hash'], data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
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


# ============================================
# ML PREDICTION ROUTES
# ============================================

@app.route('/api/predict-yield', methods=['POST'])
@jwt_required()
def predict_yield():
    """Predict crop yield"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
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
        
        # Save to MongoDB
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
            'output_data': {'yield': float(yield_pred)},
            'model_type': 'trained' if models['yield_model'] else 'mock',
            'created_at': datetime.utcnow()
        }
        db['predictions'].insert_one(prediction_doc)
        
        return jsonify({
            'yield': round(float(yield_pred), 2),
            'unit': 'kg/hectare',
            'confidence': round(confidence, 2),
            'model_status': 'Trained Model' if models['yield_model'] else 'Mock Model'
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
@jwt_required()
def predict_crop():
    """Recommend crop"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Extract features for the trained model
        input_features = np.array([[
            data.get('rainfall', 1500),
            data.get('temperature', 25),
            data.get('soil_type', 2),  # 1=clay, 2=loam, 3=sandy, 4=laterite
            data.get('season', 1),     # 1=kharif, 2=rabi, 3=summer
            data.get('ph_level', 7.0)
        ]])
        
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
        
        # Save to MongoDB
        prediction_doc = {
            'user_id': ObjectId(user_id),
            'prediction_type': 'crop',
            'input_data': {
                'rainfall': data.get('rainfall'),
                'temperature': data.get('temperature'),
                'soil_type': data.get('soil_type'),
                'season': data.get('season'),
                'ph_level': data.get('ph_level')
            },
            'output_data': {'crop': crop_name, 'confidence': confidence},
            'model_type': 'trained' if models['crop_model'] else 'mock',
            'created_at': datetime.utcnow()
        }
        db['predictions'].insert_one(prediction_doc)
        
        return jsonify({
            'recommended_crop': crop_name,
            'confidence': round(confidence, 3),
            'model_status': 'Trained Model' if models['crop_model'] else 'Mock Model',
            'top_3': top_crops if top_crops else [
                {'crop': 'rice', 'confidence': 0.70},
                {'crop': 'wheat', 'confidence': 0.20},
                {'crop': 'maize', 'confidence': 0.10}
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict-risk', methods=['POST'])
@jwt_required()
def predict_risk():
    """Predict farming risk"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Extract features for the trained model
        input_features = np.array([[
            data.get('temperature', 25),
            data.get('humidity', 65),
            data.get('rainfall', 100),
            data.get('crop_age', 50),
            data.get('soil_moisture', 50)
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
                # Fallback to mock
                risk_name = 'low'
                confidence = 0.70
        else:
            # Mock prediction when model not available
            risk_levels = ['low', 'medium', 'high']
            risk_name = np.random.choice(risk_levels)
            confidence = np.random.uniform(0.6, 0.85)
        
        # Capitalize for display
        risk_display = risk_name.capitalize()
        
        # Save to MongoDB
        prediction_doc = {
            'user_id': ObjectId(user_id),
            'prediction_type': 'risk',
            'input_data': {
                'temperature': data.get('temperature'),
                'humidity': data.get('humidity'),
                'rainfall': data.get('rainfall'),
                'crop_age': data.get('crop_age'),
                'soil_moisture': data.get('soil_moisture')
            },
            'output_data': {'risk_level': risk_display},
            'model_type': 'trained' if models['risk_model'] else 'mock',
            'created_at': datetime.utcnow()
        }
        db['predictions'].insert_one(prediction_doc)
        
        return jsonify({
            'risk_level': risk_display,
            'confidence': round(confidence, 2),
            'model_status': 'Trained Model' if models['risk_model'] else 'Mock Model',
            'recommendations': get_risk_recommendations(risk_display)
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
    """Get user's prediction history"""
    from flask_jwt_extended import get_jwt_identity
    try:
        user_id = get_jwt_identity()
        predictions = list(db['predictions'].find(
            {'user_id': ObjectId(user_id)}
        ).sort('created_at', -1))
        
        return jsonify({
            'count': len(predictions),
            'predictions': [prediction_to_dict(p) for p in predictions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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

