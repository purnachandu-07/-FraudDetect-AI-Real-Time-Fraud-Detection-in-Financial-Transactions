import numpy as np
import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)


def generate_synthetic_data(n_samples: int = 100_000) -> pd.DataFrame:
    np.random.seed(42)
    n_legit = int(n_samples * 0.98)
    n_fraud = n_samples - n_legit

    # --- Legitimate transactions ---
    legit = pd.DataFrame({
        "amount": np.random.lognormal(mean=4.0, sigma=1.0, size=n_legit),
        "merchant_category": np.random.randint(0, 8, size=n_legit),
        "hour_of_day": np.random.choice(range(6, 23), size=n_legit),
        "day_of_week": np.random.randint(0, 7, size=n_legit),
        "velocity_1h": np.random.randint(1, 4, size=n_legit),
        "geo_distance": np.random.exponential(scale=20, size=n_legit),
        "is_foreign": np.random.choice([0, 1], size=n_legit, p=[0.95, 0.05]),
        "device_mismatch": np.random.choice([0, 1], size=n_legit, p=[0.97, 0.03]),
        "is_fraud": 0,
    })

    # --- Fraudulent transactions ---
    fraud = pd.DataFrame({
        "amount": np.random.lognormal(mean=6.5, sigma=1.2, size=n_fraud),
        "merchant_category": np.random.randint(0, 8, size=n_fraud),
        "hour_of_day": np.random.choice([0, 1, 2, 3, 4, 22, 23], size=n_fraud),
        "day_of_week": np.random.randint(0, 7, size=n_fraud),
        "velocity_1h": np.random.randint(5, 20, size=n_fraud),
        "geo_distance": np.random.exponential(scale=500, size=n_fraud),
        "is_foreign": np.random.choice([0, 1], size=n_fraud, p=[0.30, 0.70]),
        "device_mismatch": np.random.choice([0, 1], size=n_fraud, p=[0.20, 0.80]),
        "is_fraud": 1,
    })

    df = pd.concat([legit, fraud], ignore_index=True).sample(frac=1, random_state=42)
    return df


FEATURE_COLS = [
    "amount", "merchant_category", "hour_of_day", "day_of_week",
    "velocity_1h", "geo_distance", "is_foreign", "device_mismatch",
]


def train_and_save():
    print("[DATA] Generating synthetic dataset...")
    df = generate_synthetic_data()
    X = df[FEATURE_COLS].values
    y = df["is_fraud"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("[SMOTE] Applying SMOTE oversampling...")
    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X_train, y_train)

    print("[SCALE] Fitting scaler...")
    scaler = StandardScaler()
    X_res_scaled = scaler.fit_transform(X_res)
    X_test_scaled = scaler.transform(X_test)

    metrics = {}

    # --- Random Forest ---
    print("[RF] Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_res_scaled, y_res)
    rf_pred = rf.predict(X_test_scaled)
    rf_prob = rf.predict_proba(X_test_scaled)[:, 1]
    metrics["random_forest"] = {
        "accuracy": float(accuracy_score(y_test, rf_pred)),
        "precision": float(precision_score(y_test, rf_pred, zero_division=0)),
        "recall": float(recall_score(y_test, rf_pred, zero_division=0)),
        "f1": float(f1_score(y_test, rf_pred, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_test, rf_prob)),
    }
    print(f"   RF Accuracy: {metrics['random_forest']['accuracy']:.4f}  AUC: {metrics['random_forest']['auc_roc']:.4f}")

    # --- XGBoost ---
    print("[XGB] Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        use_label_encoder=False, eval_metric="logloss",
        random_state=42, n_jobs=-1,
    )
    xgb_model.fit(X_res_scaled, y_res)
    xgb_pred = xgb_model.predict(X_test_scaled)
    xgb_prob = xgb_model.predict_proba(X_test_scaled)[:, 1]
    metrics["xgboost"] = {
        "accuracy": float(accuracy_score(y_test, xgb_pred)),
        "precision": float(precision_score(y_test, xgb_pred, zero_division=0)),
        "recall": float(recall_score(y_test, xgb_pred, zero_division=0)),
        "f1": float(f1_score(y_test, xgb_pred, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_test, xgb_prob)),
    }
    print(f"   XGB Accuracy: {metrics['xgboost']['accuracy']:.4f}  AUC: {metrics['xgboost']['auc_roc']:.4f}")

    # --- Save models ---
    with open(os.path.join(MODELS_DIR, "rf_model.pkl"), "wb") as f:
        pickle.dump(rf, f)
    with open(os.path.join(MODELS_DIR, "xgb_model.pkl"), "wb") as f:
        pickle.dump(xgb_model, f)
    with open(os.path.join(MODELS_DIR, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)

    print("[OK] Models saved successfully!")
    return metrics


if __name__ == "__main__":
    train_and_save()
