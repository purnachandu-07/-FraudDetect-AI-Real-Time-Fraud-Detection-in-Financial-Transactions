import pickle
import os
import numpy as np
from typing import Tuple, Dict

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

FEATURE_COLS = [
    "amount", "merchant_category", "hour_of_day", "day_of_week",
    "velocity_1h", "geo_distance", "is_foreign", "device_mismatch",
]

_cache: Dict = {}


def _load():
    global _cache
    if _cache:
        return
    rf_path = os.path.join(MODELS_DIR, "rf_model.pkl")
    xgb_path = os.path.join(MODELS_DIR, "xgb_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")

    if not all(os.path.exists(p) for p in [rf_path, xgb_path, scaler_path]):
        raise FileNotFoundError("Models not found. Run train.py first.")

    with open(rf_path, "rb") as f:
        _cache["rf"] = pickle.load(f)
    with open(xgb_path, "rb") as f:
        _cache["xgb"] = pickle.load(f)
    with open(scaler_path, "rb") as f:
        _cache["scaler"] = pickle.load(f)


def predict(
    amount: float,
    merchant_category: int,
    hour_of_day: int,
    day_of_week: int,
    velocity_1h: int,
    geo_distance: float,
    is_foreign: int,
    device_mismatch: int,
    model_name: str = "xgboost",
) -> Tuple[float, bool, str]:
    """
    Returns (risk_score 0-1, is_fraud bool, risk_tier str)
    """
    _load()
    features = np.array([[
        amount, merchant_category, hour_of_day, day_of_week,
        velocity_1h, geo_distance, is_foreign, device_mismatch,
    ]])
    scaler = _cache["scaler"]
    X = scaler.transform(features)

    model = _cache["xgb"] if model_name == "xgboost" else _cache["rf"]
    proba = model.predict_proba(X)[0][1]
    score = float(proba)

    if score >= 0.85:
        tier = "CRITICAL"
    elif score >= 0.65:
        tier = "HIGH"
    elif score >= 0.40:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    is_fraud = score >= 0.65
    return score, is_fraud, tier
