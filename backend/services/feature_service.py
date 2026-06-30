import pandas as pd
import numpy as np
from datetime import datetime
from database.db import get_connection

def engineer_features(dataset_id: int, file_path: str):
    df = pd.read_csv(file_path)
    original_shape = df.shape

    df['datetime'] = pd.to_datetime(df['time_stamp'], unit='ms')
    df['hour_of_day'] = df['datetime'].dt.hour
    df['day_of_week'] = df['datetime'].dt.dayofweek
    df['month'] = df['datetime'].dt.month

    df['rush_hour'] = df['hour_of_day'].apply(
        lambda h: 1 if (7 <= h <= 9) or (17 <= h <= 20) else 0
    )

    df['weekend'] = df['day_of_week'].apply(
        lambda d: 1 if d >= 5 else 0
    )

    def categorize_weather(row):
        rain = row['rain'] if pd.notna(row['rain']) else 0
        clouds = row['clouds'] if pd.notna(row['clouds']) else 0
        if rain > 0.5:
            return 3  # stormy
        elif rain > 0.1:
            return 2  # rainy
        elif clouds > 50:
            return 1  # cloudy
        else:
            return 0  # clear
    df['weather_bin'] = df.apply(categorize_weather, axis=1)

    df['distance_bin'] = pd.cut(
        df['distance'],
        bins=[0, 1, 3, float('inf')],
        labels=[0, 1, 2]
    ).astype(float)


    df['hour_slot'] = df['datetime'].dt.floor('h')
    demand = df.groupby(['source', 'hour_slot']).size().reset_index()
    demand.columns = ['source', 'hour_slot', 'demand_proxy']
    df = df.merge(demand, on=['source', 'hour_slot'], how='left')

    df['cab_type_encoded'] = df['cab_type'].astype('category').cat.codes
    df['source_encoded'] = df['source'].astype('category').cat.codes
    df['destination_encoded'] = df['destination'].astype('category').cat.codes

   
    df['event_nearby'] = 0
    df = df.dropna(subset=['surge_multiplier', 'distance'])
    df = df[df['surge_multiplier'] > 0]

    df['demand_proxy'] = df['demand_proxy'].fillna(df['demand_proxy'].median())
    df['distance_bin'] = df['distance_bin'].fillna(1)
    df['weather_bin'] = df['weather_bin'].fillna(0)
    df['temp'] = df['temp'].fillna(df['temp'].median())
    df['rain'] = df['rain'].fillna(0)
    df['clouds'] = df['clouds'].fillna(0)
    df['wind'] = df['wind'].fillna(df['wind'].median())
    df['humidity'] = df['humidity'].fillna(df['humidity'].median())

    feature_columns = [
        'hour_of_day', 'day_of_week', 'month', 'rush_hour', 'weekend',
        'weather_bin', 'distance', 'distance_bin', 'cab_type_encoded',
        'source_encoded', 'destination_encoded', 'demand_proxy',
        'event_nearby', 'temp', 'rain', 'clouds', 'wind', 'humidity',
        'surge_multiplier'
    ]

    df_final = df[feature_columns].copy()
    new_shape = df_final.shape

    engineered_path = f"uploads/engineered_{dataset_id}.csv"
    df_final.to_csv(engineered_path, index=False)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pipeline_runs (dataset_id, stage, status, logs, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (dataset_id, "feature_engineering", "complete",
          f"Shape: {original_shape} → {new_shape}",
          datetime.now().isoformat()))
    conn.commit()
    conn.close()

    features_created = [
        "hour_of_day", "day_of_week", "month", "rush_hour",
        "weekend", "weather_bin", "distance_bin", "demand_proxy",
        "cab_type_encoded", "source_encoded", "destination_encoded",
        "event_nearby"
    ]

    return {
        "dataset_id": dataset_id,
        "original_shape": {"rows": original_shape[0], "cols": original_shape[1]},
        "engineered_shape": {"rows": new_shape[0], "cols": new_shape[1]},
        "features_created": features_created,
        "target_variable": "surge_multiplier",
        "engineered_file": engineered_path,
        "sample": df_final.head(3).fillna(0).to_dict(orient="records")
    }