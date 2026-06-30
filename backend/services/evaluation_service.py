import json
from database.db import get_connection

def get_evaluation_results(dataset_id: int):
    """
    Fetch all experiment results for a dataset from SQLite.
    Return comparison data for frontend dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT e.id, e.model_type, e.mae, e.rmse, e.r2,
               e.training_time, e.hyperparameters, e.feature_list,
               e.created_at, m.version, m.status
        FROM experiments e
        JOIN model_registry m ON e.id = m.experiment_id
        WHERE e.run_id = ?
        ORDER BY e.created_at DESC
    """, (dataset_id,))

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {"experiments": [], "best_model": None}

    experiments = []
    for row in rows:
        experiments.append({
            "experiment_id": row[0],
            "model_type": row[1],
            "mae": row[2],
            "rmse": row[3],
            "r2": row[4],
            "training_time": row[5],
            "hyperparameters": json.loads(row[6]) if row[6] else {},
            "feature_count": len(json.loads(row[7])) if row[7] else 0,
            "created_at": row[8],
            "version": row[9],
            "status": row[10]
        })

    best = min(experiments, key=lambda x: x['rmse'])

    return {
        "experiments": experiments,
        "best_model": best['model_type'],
        "best_version": best['version'],
        "best_experiment_id": best['experiment_id']
    }