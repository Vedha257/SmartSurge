import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
import os
import json
import time
from datetime import datetime
from database.db import get_connection


FEATURE_COLUMNS = [
    'hour_of_day', 'day_of_week', 'month', 'rush_hour', 'weekend',
    'weather_bin', 'distance', 'distance_bin', 'cab_type_encoded',
    'source_encoded', 'destination_encoded', 'demand_proxy',
    'event_nearby', 'temp', 'rain', 'clouds', 'wind', 'humidity'
]
TARGET_COLUMN = 'surge_multiplier'

def get_next_version():
    """Get next model version number from registry"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM model_registry")
    count = cursor.fetchone()[0]
    conn.close()
    return f"v{count + 1}"


def train_models(dataset_id: int, file_path: str):

    conn = get_connection()
    cursor = conn.cursor()
    
    current_dataset = cursor.execute("""
        SELECT filename, rows FROM datasets WHERE id = ?
    """, (dataset_id,)).fetchone()

    existing = []
    if current_dataset:
        filename, rows = current_dataset
        previous = cursor.execute("""
            SELECT id FROM datasets 
            WHERE filename = ? AND rows = ? AND id != ?
            ORDER BY id ASC LIMIT 1
        """, (filename, rows, dataset_id)).fetchone()

        if previous:
            previous_dataset_id = previous[0]
            existing = cursor.execute("""
                SELECT e.id, e.model_type, e.mae, e.rmse, e.r2,
                    e.training_time, m.version, m.model_path, m.id as registry_id
                FROM experiments e
                JOIN model_registry m ON e.id = m.experiment_id
                WHERE e.run_id = ?
            """, (previous_dataset_id,)).fetchall()
    conn.close()

    if existing:
        print(f"Dataset #{dataset_id} already trained — skipping, returning existing models")
        results = []
        for row in existing:
            results.append({
                "model_type": row[1],
                "version": row[6],
                "mae": row[2],
                "rmse": row[3],
                "r2": row[4],
                "training_time": row[5],
                "model_path": row[7],
                "experiment_id": row[0],
                "registry_id": row[8]
            })
        best = min(results, key=lambda x: x['rmse'] if x['rmse'] else 999)
        return {
            "dataset_id": dataset_id,
            "models": results,
            "best_model": best['model_type'],
            "best_version": best['version'],
            "features_used": [],
            "train_samples": 0,
            "val_samples": 0,
            "already_trained": True,
            "message": f"Dataset #{dataset_id} already trained — using existing models"
        }

    df = pd.read_csv(file_path)
    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    X = df[available_features]
    y = df[TARGET_COLUMN]

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training on {len(X_train)} samples, validating on {len(X_val)} samples")

    results = []
    conn = get_connection()
    cursor = conn.cursor()

    print("Training XGBoost...")
    xgb_params = {
        'n_estimators': 100,
        'max_depth': 6,
        'learning_rate': 0.1,
        'random_state': 42,
        'n_jobs': -1
    }
    start = time.time()
    xgb_model = XGBRegressor(**xgb_params)
    xgb_model.fit(X_train, y_train)
    xgb_time = round(time.time() - start, 2)

    xgb_preds = xgb_model.predict(X_val)
    xgb_mae = round(mean_absolute_error(y_val, xgb_preds), 4)
    xgb_rmse = round(np.sqrt(mean_squared_error(y_val, xgb_preds)), 4)
    xgb_r2 = round(r2_score(y_val, xgb_preds), 4)
    print(f"XGBoost — MAE: {xgb_mae}, RMSE: {xgb_rmse}, R²: {xgb_r2}")

    os.makedirs("models", exist_ok=True)
    xgb_version = get_next_version()
    xgb_path = f"models/xgboost_{xgb_version}.joblib"
    joblib.dump(xgb_model, xgb_path)

    cursor.execute("""
        INSERT INTO experiments
        (run_id, model_type, mae, rmse, r2, training_time,
         hyperparameters, feature_list, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (dataset_id, "XGBoost", xgb_mae, xgb_rmse, xgb_r2, xgb_time,
          json.dumps(xgb_params), json.dumps(available_features),
          datetime.now().isoformat()))
    xgb_exp_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO model_registry
        (experiment_id, version, status, model_path, promoted_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (xgb_exp_id, xgb_version, "experimental",
          xgb_path, None, "XGBoost regressor"))

    results.append({
        "model_type": "XGBoost",
        "version": xgb_version,
        "mae": xgb_mae,
        "rmse": xgb_rmse,
        "r2": xgb_r2,
        "training_time": xgb_time,
        "model_path": xgb_path,
        "experiment_id": xgb_exp_id
    })

    print("Training Random Forest...")
    rf_params = {
        'n_estimators': 100,
        'max_depth': 10,
        'random_state': 42,
        'n_jobs': -1
    }
    start = time.time()
    rf_model = RandomForestRegressor(**rf_params)
    rf_model.fit(X_train, y_train)
    rf_time = round(time.time() - start, 2)

    rf_preds = rf_model.predict(X_val)
    rf_mae = round(mean_absolute_error(y_val, rf_preds), 4)
    rf_rmse = round(np.sqrt(mean_squared_error(y_val, rf_preds)), 4)
    rf_r2 = round(r2_score(y_val, rf_preds), 4)
    print(f"Random Forest — MAE: {rf_mae}, RMSE: {rf_rmse}, R²: {rf_r2}")

    rf_version = get_next_version()
    rf_path = f"models/rf_{rf_version}.joblib"
    joblib.dump(rf_model, rf_path)

    cursor.execute("""
        INSERT INTO experiments
        (run_id, model_type, mae, rmse, r2, training_time,
         hyperparameters, feature_list, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (dataset_id, "RandomForest", rf_mae, rf_rmse, rf_r2, rf_time,
          json.dumps(rf_params), json.dumps(available_features),
          datetime.now().isoformat()))
    rf_exp_id = cursor.lastrowid

  
    cursor.execute("""
        INSERT INTO model_registry
        (experiment_id, version, status, model_path, promoted_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (rf_exp_id, rf_version, "experimental",
          rf_path, None, "Random Forest regressor"))

    conn.commit()
    conn.close()

    results.append({
        "model_type": "RandomForest",
        "version": rf_version,
        "mae": rf_mae,
        "rmse": rf_rmse,
        "r2": rf_r2,
        "training_time": rf_time,
        "model_path": rf_path,
        "experiment_id": rf_exp_id
    })

  
    best = min(results, key=lambda x: x['rmse'])

    return {
        "dataset_id": dataset_id,
        "models": results,
        "best_model": best['model_type'],
        "best_version": best['version'],
        "features_used": available_features,
        "train_samples": len(X_train),
        "val_samples": len(X_val)
    }