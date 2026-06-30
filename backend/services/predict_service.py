import pandas as pd
import numpy as np
import joblib
import json
from database.db import get_connection
from services.registry_service import get_production_model

_cached_model = None
_cached_version = None

def get_model():
    """Load production model from disk, cache it in memory"""
    global _cached_model, _cached_version

    prod = get_production_model()
    if not prod:
        raise Exception("No production model found. Please promote a model first.")

    if _cached_version != prod['version']:
        import os
        
        model_path = prod['model_path']
        if not os.path.isabs(model_path):
            
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, model_path)
        print(f"Loading model from: {model_path}")
        _cached_model = joblib.load(model_path)
        _cached_version = prod['version']
        print(f"Loaded model: {prod['model_type']} {prod['version']}")

    return _cached_model, prod


def build_input_features(input_data: dict) -> pd.DataFrame:
    """
    Convert user input from UI into the same feature format
    the model was trained on.
    """

    weather_map = {'clear': 0, 'cloudy': 1, 'rainy': 2, 'stormy': 3}
    weather_bin = weather_map.get(input_data.get('weather', 'clear'), 0)

   
    cab_map = {'UberX': 0, 'UberXL': 1, 'UberPool': 2,
               'Lyft': 3, 'LyftXL': 4, 'LyftShared': 5}
    cab_encoded = cab_map.get(input_data.get('cab_type', 'UberX'), 0)

    
    zone_map = {
        'Airport': 0, 'Back Bay': 1, 'Beacon Hill': 2,
        'Boston Common': 3, 'Downtown': 4, 'Fenway': 5,
        'Financial District': 6, 'Haymarket Square': 7,
        'North End': 8, 'North Station': 9, 'Northeastern University': 10,
        'South Station': 11, 'Theatre District': 12, 'West End': 13
    }
    source_encoded = zone_map.get(input_data.get('source', 'Downtown'), 4)
    destination_encoded = zone_map.get(
        input_data.get('destination', 'Airport'), 0
    )

    hour = int(input_data.get('hour_of_day', 8))
    day = int(input_data.get('day_of_week', 0))
    distance = float(input_data.get('distance', 2.0))

    features = {
        'hour_of_day': hour,
        'day_of_week': day,
        'month': int(input_data.get('month', 6)),
        'rush_hour': 1 if (7 <= hour <= 9) or (17 <= hour <= 20) else 0,
        'weekend': 1 if day >= 5 else 0,
        'weather_bin': weather_bin,
        'distance': distance,
        'distance_bin': 0 if distance < 1 else (1 if distance < 3 else 2),
        'cab_type_encoded': cab_encoded,
        'source_encoded': source_encoded,
        'destination_encoded': destination_encoded,
        'demand_proxy': int(input_data.get('demand_proxy', 50)),
        'event_nearby': int(input_data.get('event_nearby', 0)),
        'temp': float(input_data.get('temp', 60)),
        'rain': float(input_data.get('rain', 0)),
        'clouds': float(input_data.get('clouds', 20)),
        'wind': float(input_data.get('wind', 5)),
        'humidity': float(input_data.get('humidity', 0.5))
    }

    return pd.DataFrame([features])


def get_demand_level(surge: float) -> str:
    """Convert surge multiplier to human-readable demand level"""
    if surge < 1.2:
        return 'Low'
    elif surge < 1.5:
        return 'Medium'
    elif surge < 2.0:
        return 'High'
    else:
        return 'Very High'


def predict_surge(input_data: dict) -> dict:
    """
    Run inference on input data.
    Log prediction to SQLite.
    Return surge + demand level.
    """
    model, prod_info = get_model()
    input_df = build_input_features(input_data)

    
    surge = float(model.predict(input_df)[0])
    surge = round(max(1.0, surge), 2)  
    demand_level = get_demand_level(surge)

    wait_times = {'Low': '2-4', 'Medium': '4-7', 'High': '7-12', 'Very High': '12-20'}
    wait_time = wait_times[demand_level]

   
    conn = get_connection()
    cursor = conn.cursor()
    from datetime import datetime
    cursor.execute("""
        INSERT INTO predictions
        (model_version, input_features, predicted_surge, demand_level, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (prod_info['version'], json.dumps(input_data),
          surge, demand_level, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    return {
        "surge_multiplier": surge,
        "demand_level": demand_level,
        "wait_time": wait_time,
        "model_version": prod_info['version'],
        "model_type": prod_info['model_type']
    }