"""Evaluate production models on test splits and compare to synthetic baseline (if present)."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder

BASE_DIR = Path(__file__).resolve().parent
SPLITS_DIR = BASE_DIR / "data" / "splits"
MODEL_DIR = BASE_DIR / "models"
PROD_DIR = MODEL_DIR / "production"


def load_model_pair(name: str, prod_required: bool = True):
    """Load model + scaler (+ encoder) from production, fallback to base if allowed."""
    paths = {
        'model': [PROD_DIR / f"{name}_model.pkl", MODEL_DIR / f"{name}_model.pkl"],
        'scaler': [PROD_DIR / f"{name}_scaler.pkl", MODEL_DIR / f"{name}_scaler.pkl"],
        'encoder': [PROD_DIR / f"{name}_label_encoder.pkl", MODEL_DIR / f"{name}_label_encoder.pkl"],
    }
    def first(p_list):
        for p in p_list:
            if p.exists():
                return p
        return None
    model_path = first(paths['model'])
    scaler_path = first(paths['scaler'])
    encoder_path = first(paths['encoder'])
    if prod_required and (model_path is None or model_path.parent != PROD_DIR):
        return None, None, None
    model = joblib.load(model_path) if model_path else None
    scaler = joblib.load(scaler_path) if scaler_path else None
    encoder = joblib.load(encoder_path) if encoder_path and encoder_path.exists() else None
    return model, scaler, encoder


def eval_yield():
    test_path = SPLITS_DIR / "test_yield.csv"
    if not test_path.exists():
        return None
    df = pd.read_csv(test_path)
    feature_candidates = ["rainfall", "temperature", "pesticides"]
    features = [c for c in feature_candidates if c in df.columns]
    target = "yield"
    if target not in df.columns or not features:
        return None

    model, scaler, _ = load_model_pair("yield", prod_required=True)
    if not model or not scaler:
        return None

    X = df[features].values
    y = df[target].values
    Xs = scaler.transform(X)
    preds = model.predict(Xs)

    rmse = float(mean_squared_error(y, preds) ** 0.5)
    mae = float(mean_absolute_error(y, preds))
    r2 = float(r2_score(y, preds))
    return {
        "samples": len(df),
        "features": features,
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
    }


def eval_crop():
    test_path = SPLITS_DIR / "test_crop.csv"
    if not test_path.exists():
        return None
    df = pd.read_csv(test_path)
    feature_candidates = ["nitrogen", "phosphorus", "potassium", "temperature", "ph", "rainfall", "npk_ratio"]
    features = [c for c in feature_candidates if c in df.columns]
    target = "crop"
    if target not in df.columns or not features:
        return None

    model, scaler, encoder = load_model_pair("crop", prod_required=True)
    if not model or not scaler or not encoder:
        return None

    X = df[features].values
    y = df[target].values
    Xs = scaler.transform(X)
    y_enc = encoder.transform(y)
    preds = model.predict(Xs)
    acc = float(accuracy_score(y_enc, preds))
    return {
        "samples": len(df),
        "features": features,
        "classes": encoder.classes_.tolist(),
        "accuracy": acc,
    }


def main():
    results = {
        "yield": eval_yield(),
        "crop": eval_crop(),
    }
    print("\n==================================================")
    print("PRODUCTION MODEL EVALUATION")
    print("==================================================")

    if results["yield"]:
        y = results["yield"]
        print("[Yield]")
        print(f"  Samples: {y['samples']}")
        print(f"  Features: {y['features']}")
        print(f"  RMSE: {y['rmse']:.4f}")
        print(f"  MAE:  {y['mae']:.4f}")
        print(f"  R²:   {y['r2']:.4f}\n")
    else:
        print("[Yield] No evaluation available (missing data/model)")

    if results["crop"]:
        c = results["crop"]
        print("[Crop]")
        print(f"  Samples: {c['samples']}")
        print(f"  Features: {c['features']}")
        print(f"  Accuracy: {c['accuracy']:.4f}")
        print(f"  Classes: {c['classes']}\n")
    else:
        print("[Crop] No evaluation available (missing data/model)")

    out_path = PROD_DIR / "evaluation_summary.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print("Summary saved to", out_path)
    print("==================================================")


if __name__ == "__main__":
    main()
