from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['neurovia']

print("=== Database Status ===")
print(f"Total Users: {db.users.count_documents({})}")
print(f"Total Predictions: {db.predictions.count_documents({})}")

# Get last 5 predictions
print("\n=== Last 5 Predictions ===")
preds = list(db.predictions.find().sort('created_at', -1).limit(5))
if preds:
    for i, p in enumerate(preds, 1):
        print(f"{i}. Type: {p.get('prediction_type')}, User: {p.get('user_id')}, Time: {p.get('created_at')}")
        if p.get('output_data'):
            print(f"   Output: {p.get('output_data')}")
else:
    print("No predictions found")

# Count by type
print("\n=== Predictions by Type ===")
for ptype in ['yield', 'crop', 'risk']:
    count = db.predictions.count_documents({'prediction_type': ptype})
    print(f"{ptype}: {count}")

# Check users with prediction counts
print("\n=== Users ===")
users = list(db.users.find().limit(5))
for user in users:
    pred_count = db.predictions.count_documents({'user_id': user['_id']})
    print(f"- {user.get('name')} ({user.get('email')}): {pred_count} predictions")
