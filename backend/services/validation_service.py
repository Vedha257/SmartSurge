import pandas as pd
import numpy as np
from datetime import datetime
from database.db import get_connection

REQUIRED_COLUMNS = [
    'distance', 'cab_type', 'time_stamp',
    'source', 'destination', 'surge_multiplier'
]

def validate_dataset(dataset_id: int, file_path: str):
    """
    Run validation checks on the dataset.
    Returns quality report and score out of 100.
    """

    df = pd.read_csv(file_path)
    issues = []
    score = 100

    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        issues.append(f"Missing required columns: {missing_cols}")
        score -= 30
    schema_passed = len(missing_cols) == 0

   
    missing_pct = (df.isnull().sum() / len(df) * 100).to_dict()
    high_missing = {k: round(v, 2) for k, v in missing_pct.items() if v > 20}
    if high_missing:
        issues.append(f"High missing values in: {high_missing}")
        score -= 20
    total_missing_pct = round(df.isnull().sum().sum() / df.size * 100, 2)

 
    duplicate_count = df.duplicated().sum()
    if duplicate_count > len(df) * 0.05:  # more than 5% duplicates
        issues.append(f"High duplicate rows: {duplicate_count}")
        score -= 15

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outlier_counts = {}
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        outliers = ((df[col] < Q1 - 1.5 * IQR) |
                    (df[col] > Q3 + 1.5 * IQR)).sum()
        if outliers > 0:
            outlier_counts[col] = int(outliers)
    if sum(outlier_counts.values()) > len(df) * 0.1:
        issues.append("High outlier count detected")
        score -= 10

   
    if 'surge_multiplier' in df.columns:
        invalid_surge = (df['surge_multiplier'] <= 0).sum()
        if invalid_surge > 0:
            issues.append(f"Invalid surge values (<=0): {invalid_surge}")
            score -= 10

    score = max(0, score)  

 
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE datasets SET quality_score = ? WHERE id = ?
    """, (score, dataset_id))

  
    cursor.execute("""
        INSERT INTO pipeline_runs (dataset_id, stage, status, logs, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (dataset_id, "validation",
          "complete" if score >= 60 else "warning",
          str(issues), datetime.now().isoformat()))

    conn.commit()
    conn.close()

    return {
        "dataset_id": dataset_id,
        "quality_score": score,
        "schema_passed": schema_passed,
        "missing_columns": missing_cols,
        "total_missing_pct": total_missing_pct,
        "high_missing_columns": high_missing,
        "duplicate_count": int(duplicate_count),
        "outlier_counts": outlier_counts,
        "issues": issues,
        "recommendation": "Proceed to feature engineering" if score >= 60
                          else "Fix data issues before proceeding"
    }