"""
Mock Database - stores data in JSON files instead of MongoDB
Falls back when MongoDB is unavailable
"""

import json
import os
from pathlib import Path
from datetime import datetime
from bson.objectid import ObjectId

DB_DIR = Path(__file__).parent / 'data' / 'database'
DB_DIR.mkdir(parents=True, exist_ok=True)

USERS_FILE = DB_DIR / 'users.json'
PREDICTIONS_FILE = DB_DIR / 'predictions.json'

# Ensure files exist
USERS_FILE.touch(exist_ok=True)
PREDICTIONS_FILE.touch(exist_ok=True)

def _load_json(filepath):
    """Load JSON file, return empty list if empty or corrupted"""
    try:
        if filepath.stat().st_size == 0:
            return []
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return []

def _save_json(filepath, data):
    """Save data to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)

class MockMongoDB:
    """Mock MongoDB using JSON files"""
    
    def __init__(self):
        self.users = self._collection('users')
        self.predictions = self._collection('predictions')
    
    def _collection(self, name):
        return MockCollection(name)

class MockCollection:
    """Mock MongoDB collection"""
    
    def __init__(self, name):
        self.name = name
        self.file = USERS_FILE if name == 'users' else PREDICTIONS_FILE
    
    def insert_one(self, document):
        """Insert a document"""
        if '_id' not in document:
            document['_id'] = str(ObjectId())
        
        data = _load_json(self.file)
        data.append(document)
        _save_json(self.file, data)
        
        class InsertResult:
            def __init__(self, doc_id):
                self.inserted_id = doc_id
        
        return InsertResult(document['_id'])
    
    def find_one(self, query):
        """Find one document matching query"""
        data = _load_json(self.file)
        for doc in data:
            if self._matches(doc, query):
                return doc
        return None
    
    def find(self, query):
        """Find all documents matching query"""
        data = _load_json(self.file)
        results = [doc for doc in data if self._matches(doc, query)]
        return MockCursor(results)
    
    def _matches(self, doc, query):
        """Check if document matches query"""
        for key, value in query.items():
            if key not in doc or doc[key] != value:
                return False
        return True
    
    def create_index(self, field, unique=False):
        """Mock index creation"""
        pass
    
    def list_collection_names(self):
        """List all collections"""
        return ['users', 'predictions']
    
    def count_documents(self, query=None):
        """Count documents matching query"""
        data = _load_json(self.file)
        if query is None or not query:
            return len(data)
        # Filter by query if provided
        matching = [doc for doc in data if self._matches(doc, query)]
        return len(matching)

class MockCursor:
    """Mock MongoDB cursor"""
    
    def __init__(self, data):
        self.data = data
    
    def sort(self, field, direction):
        """Sort results"""
        self.data.sort(key=lambda x: x.get(field, ''), reverse=(direction == -1))
        return self
    
    def __iter__(self):
        return iter(self.data)
    
    def __next__(self):
        if not self.data:
            raise StopIteration
        return self.data.pop(0)

class MockClient:
    """Mock MongoDB client"""
    
    def __init__(self, uri):
        self.db = MockMongoDB()
    
    def __getitem__(self, db_name):
        """Get database"""
        return self.db
    
    @property
    def admin(self):
        """Mock admin"""
        return MockAdmin()

class MockAdmin:
    """Mock admin commands"""
    
    def command(self, cmd):
        """Mock command execution"""
        if cmd == 'ping':
            return {'ok': 1}
        return {}

def get_mock_db():
    """Get mock database instance"""
    return MockMongoDB()

# Test
if __name__ == '__main__':
    db = get_mock_db()
    
    # Insert user
    result = db.users.insert_one({
        'name': 'Test User',
        'email': 'test@example.com',
        'aadhar': '123456789012',
        'password_hash': 'hashed',
        'created_at': datetime.utcnow()
    })
    print(f"Inserted user: {result.inserted_id}")
    
    # Find user
    user = db.users.find_one({'email': 'test@example.com'})
    print(f"Found user: {user}")
    
    # Count users
    count = db.users.countDocuments()
    print(f"Total users: {count}")
