import pandas as pd
import numpy as np
import json
from scipy import stats
from datetime import datetime
from database.db import get_connection

MONITORED_FEATURES = [
    'hour_of_day', 'day_of_week', 'weather_bin',
    'distance', 'demand_proxy', 'event_nearby',
    'rush_hour', 'weekend'
]

def load_training_distributions(engineered_file_path: str) -> dict:
    """
    Load training data and compute distribution stats per feature.
    This becomes our baseline to compare against.
    """
    try:
        df = pd.read_csv(engineered_file_path)
        distributions = {}
        for feature in MONITORED_FEATURES:
            if feature in df.columns:
                distributions[feature] = df[feature].dropna().tolist()
        return distributions
    except Exception as e:
        print(f"Could not load training distributions: {e}")
        return {}


def get_recent_predictions(limit: int = 100) -> list:
    """
    Load recent predictions from SQLite predictions table.
    Parse input_features JSON back to dict.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT input_features, predicted_surge, demand_level, timestamp
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    predictions = []
    for row in rows:
        try:
            features = json.loads(row[0])
            features['predicted_surge'] = row[1]
            features['demand_level'] = row[2]
            features['timestamp'] = row[3]
            predictions.append(features)
        except:
            continue

    return predictions


def run_drift_detection(dataset_id: int) -> dict:
    """
    Compare recent prediction input distributions vs training data.
    Use KS test to detect drift per feature.
    """
    recent_preds = get_recent_predictions(limit=100)

    if len(recent_preds) < 5:
        return {
            "status": "insufficient_data",
            "message": f"Need at least 5 predictions for drift detection. Current: {len(recent_preds)}",
            "drift_alerts": [],
            "features_checked": 0
        }

    recent_df = pd.DataFrame(recent_preds)

    engineered_path = f"uploads/engineered_{dataset_id}.csv"

    print(dataset_id)
    print(engineered_path)
    
    training_distributions = load_training_distributions(engineered_path)

    if not training_distributions:
        return {
            "status": "no_training_data",
            "message": "Could not load training data for comparison",
            "drift_alerts": [],
            "features_checked": 0
        }

    drift_alerts = []
    features_checked = 0
    conn = get_connection()
    cursor = conn.cursor()

    for feature in MONITORED_FEATURES:
        if feature not in recent_df.columns:
            continue
        if feature not in training_distributions:
            continue

        try:
            recent_values = recent_df[feature].dropna().tolist()
            training_values = training_distributions[feature]

            if len(recent_values) < 3:
                continue

            if len(training_values) > 1000:
                import random
                training_sample = random.sample(training_values, 1000)
            else:
                training_sample = training_values

    
            ks_stat, p_value = stats.ks_2samp(recent_values, training_sample)
            ks_stat = round(float(ks_stat), 4)
            p_value = round(float(p_value), 4)

            if ks_stat > 0.5:
                severity = "High"
            elif ks_stat > 0.3:
                severity = "Medium"
            elif ks_stat > 0.15:
                severity = "Low"
            else:
                severity = "None"

            features_checked += 1

           
            cursor.execute("""
                INSERT INTO drift_logs
                (feature_name, ks_statistic, p_value, drift_severity, checked_at)
                VALUES (?, ?, ?, ?, ?)
            """, (feature, ks_stat, p_value, severity,
                  datetime.now().isoformat()))

            if severity != "None":
                drift_alerts.append({
                    "feature": feature,
                    "ks_statistic": ks_stat,
                    "p_value": p_value,
                    "severity": severity,
                    "recent_mean": round(float(np.mean(recent_values)), 3),
                    "training_mean": round(float(np.mean(training_sample)), 3)
                })

        except Exception as e:
            print(f"KS test failed for {feature}: {e}")
            continue

    conn.commit()
    conn.close()

    return {
        "status": "complete",
        "features_checked": features_checked,
        "drift_alerts": drift_alerts,
        "total_alerts": len(drift_alerts),
        "checked_at": datetime.now().isoformat()
    }


def get_monitor_stats(dataset_id: int) -> dict:
    """
    Get summary stats for the monitoring dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()

    total_preds = cursor.execute(
        "SELECT COUNT(*) FROM predictions"
    ).fetchone()[0]


    prod_model = cursor.execute("""
        SELECT m.version, e.model_type, e.mae, e.rmse
        FROM model_registry m
        JOIN experiments e ON m.experiment_id = e.id
        WHERE m.status = 'production'
        LIMIT 1
    """).fetchone()

    active_alerts = cursor.execute("""
        SELECT COUNT(*) FROM drift_logs
        WHERE drift_severity != 'None'
        AND checked_at = (SELECT MAX(checked_at) FROM drift_logs)
    """).fetchone()[0]


    last_run = cursor.execute("""
        SELECT created_at FROM pipeline_runs
        ORDER BY id DESC LIMIT 1
    """).fetchone()

    conn.close()

    return {
        "total_predictions": total_preds,
        "production_model": {
            "version": prod_model[0] if prod_model else "None",
            "model_type": prod_model[1] if prod_model else "None",
            "mae": prod_model[2] if prod_model else None,
            "rmse": prod_model[3] if prod_model else None
        },
        "active_drift_alerts": active_alerts,
        "last_pipeline_run": last_run[0] if last_run else None,
        "dataset_id": dataset_id
    }


def get_surge_trend() -> dict:
    """
    Get surge prediction trend over last 50 predictions.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT predicted_surge, demand_level, timestamp
        FROM predictions
        ORDER BY id DESC
        LIMIT 50
    """)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {"trend": [], "avg_surge": 0}

    trend = []
    for i, row in enumerate(reversed(rows)):
        trend.append({
            "index": i + 1,
            "surge": row[0],
            "demand_level": row[1],
            "timestamp": row[2]
        })

    avg_surge = round(
        float(np.mean([r['surge'] for r in trend])), 3
    )

    return {"trend": trend, "avg_surge": avg_surge}


def get_prediction_log() -> list:
    """Get last 20 predictions for the log table"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, model_version, predicted_surge,
               demand_level, timestamp
        FROM predictions
        ORDER BY id DESC
        LIMIT 20
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "model_version": row[1],
            "predicted_surge": row[2],
            "demand_level": row[3],
            "timestamp": row[4]
        }
        for row in rows
    ]