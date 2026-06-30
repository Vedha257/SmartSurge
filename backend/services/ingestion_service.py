import pandas as pd
import os
from datetime import datetime
from database.db import get_connection

def ingest_dataset(file_path: str, filename: str):
    rides_df = pd.read_csv(file_path)

    weather_path = os.path.join(os.path.dirname(file_path), "weather.csv")
    
    if os.path.exists(weather_path):
        weather_df = pd.read_csv(weather_path)
        rides_df['ts_seconds'] = (rides_df['time_stamp'] / 1000).astype(int)

        weather_df['ts_seconds'] = weather_df['time_stamp'].astype(int)
        rides_df['ts_hour'] = (rides_df['ts_seconds'] // 3600) * 3600
        weather_df['ts_hour'] = (weather_df['ts_seconds'] // 3600) * 3600

        rides_df = rides_df.merge(
            weather_df[['location', 'ts_hour', 'temp',
                        'rain', 'clouds', 'wind', 'humidity']],
            left_on=['source', 'ts_hour'],
            right_on=['location', 'ts_hour'],
            how='left'
        )

        rides_df = rides_df.drop(
            columns=['ts_seconds', 'ts_hour', 'location'],
            errors='ignore'
        )

    row_count = len(rides_df)
    col_count = len(rides_df.columns)
    upload_time = datetime.now().isoformat()

   
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO datasets (filename, rows, columns, upload_time)
        VALUES (?, ?, ?, ?)
    """, (filename, row_count, col_count, upload_time))
    dataset_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO pipeline_runs (dataset_id, stage, status, logs, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (dataset_id, "ingestion", "complete",
          f"Ingested {row_count} rows, {col_count} columns",
          upload_time))

    conn.commit()
    conn.close()

  
    merged_path = f"uploads/merged_{dataset_id}.csv"
    rides_df.to_csv(merged_path, index=False)

  
    preview_df = rides_df.head(5).copy()
  
    for col in preview_df.columns:
        preview_df[col] = preview_df[col].astype(object).where(
            preview_df[col].notna(), None
        )
    preview = preview_df.to_dict(orient="records")

  
    import math
    def clean_value(v):
        if v is None:
            return None
        if isinstance(v, float) and math.isnan(v):
            return None
        return v

    preview = [
        {k: clean_value(v) for k, v in row.items()}
        for row in preview
    ]

    return {
        "dataset_id": dataset_id,
        "rows": row_count,
        "columns": col_count,
        "column_names": list(rides_df.columns),
        "preview": preview,
        "upload_time": upload_time,
        "merged_file": merged_path
    }