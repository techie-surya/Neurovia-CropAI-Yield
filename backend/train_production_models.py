"""Train production models on processed/split real datasets.
- Yield prediction: regression
- Crop recommendation: classification
Outputs are saved under models/production/ with scalers/encoders.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder

BASE_DIR = Path(__file__).resolve().parent
SPLITS_DIR = BASE_DIR / "data" / "splits"
PROD_DIR = BASE_DIR / "models" / "production"
PROD_DIR.mkdir(parents=True, exist_ok=True)


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return pd.read_csv(path)


def train_yield_model():
    train_path = SPLITS_DIR / "train_yield.csv"
    test_path = SPLITS_DIR / "test_yield.csv"
    df_train = load_csv(train_path)
    df_test = load_csv(test_path)

    # Prefer richer feature set if available
    candidate_features = ["rainfall", "temperature", "pesticides"]
    feature_cols = [c for c in candidate_features if c in df_train.columns] + ["yield"]

    X_train = df_train[feature_cols[:-1]].values
    y_train = df_train[feature_cols[-1]].values
    X_test = df_test[feature_cols[:-1]].values
    y_test = df_test[feature_cols[-1]].values

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = GradientBoostingRegressor(random_state=42)
    model.fit(X_train_scaled, y_train)

    preds = model.predict(X_test_scaled)
    rmse = mean_squared_error(y_test, preds) ** 0.5
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring="r2")

    joblib.dump(model, PROD_DIR / "yield_model.pkl")
    joblib.dump(scaler, PROD_DIR / "yield_scaler.pkl")

    return {
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "cv_r2_mean": float(np.mean(cv_scores)),
        "cv_r2_std": float(np.std(cv_scores)),
        "samples_train": len(df_train),
        "samples_test": len(df_test),
        "features": feature_cols[:-1],
    }


def train_crop_model():
    train_path = SPLITS_DIR / "train_crop.csv"
    test_path = SPLITS_DIR / "test_crop.csv"
    df_train = load_csv(train_path)
    df_test = load_csv(test_path)

    feature_cols = [c for c in ["nitrogen", "phosphorus", "potassium", "temperature", "ph", "rainfall", "npk_ratio"] if c in df_train.columns]
    target_col = "crop"

    X_train = df_train[feature_cols].values
    y_train = df_train[target_col].values
    X_test = df_test[feature_cols].values
    y_test = df_test[target_col].values

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    encoder = LabelEncoder()
    y_train_enc = encoder.fit_transform(y_train)
    y_test_enc = encoder.transform(y_test)

    model = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train_enc)

    preds = model.predict(X_test_scaled)
    acc = accuracy_score(y_test_enc, preds)
    report = classification_report(y_test_enc, preds, target_names=encoder.classes_, zero_division=0)

    joblib.dump(model, PROD_DIR / "crop_model.pkl")
    joblib.dump(scaler, PROD_DIR / "crop_scaler.pkl")
    joblib.dump(encoder, PROD_DIR / "crop_label_encoder.pkl")

    return {
        "accuracy": acc,
        "report": report,
        "samples_train": len(df_train),
        "samples_test": len(df_test),
        "features": feature_cols,
        "classes": encoder.classes_.tolist(),
    }


def main():
    results = {}
    print("\n==================================================")
    print("PRODUCTION TRAINING (REAL DATA)")
    print("==================================================")

    print("\n[Yield Prediction]")
    results["yield"] = train_yield_model()
    print(f"  ✓ RMSE: {results['yield']['rmse']:.4f}")
    print(f"  ✓ MAE:  {results['yield']['mae']:.4f}")
    print(f"  ✓ R²:   {results['yield']['r2']:.4f}")
    print(f"  ✓ CV R²: {results['yield']['cv_r2_mean']:.4f} ± {results['yield']['cv_r2_std']:.4f}")

    print("\n[Crop Recommendation]")
    results["crop"] = train_crop_model()
    print(f"  ✓ Accuracy: {results['crop']['accuracy']:.4f}")
    print("  ✓ Classes:", results["crop"]["classes"])
    print("\nClassification Report:\n", results["crop"]["report"])

    summary_path = PROD_DIR / "training_summary.json"
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)

    print("\nModels saved to:", PROD_DIR)
    print("Summary saved to:", summary_path)
    print("==================================================")


if __name__ == "__main__":
    main()
