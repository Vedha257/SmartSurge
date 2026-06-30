from datetime import datetime
from database.db import get_connection

def get_registry():
    """List all models in registry with their status"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.id, m.version, m.status, m.model_path,
               m.promoted_at, m.notes,
               e.model_type, e.mae, e.rmse, e.r2, e.created_at
        FROM model_registry m
        JOIN experiments e ON m.experiment_id = e.id
        ORDER BY m.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    models = []
    for row in rows:
        models.append({
            "registry_id": row[0],
            "version": row[1],
            "status": row[2],
            "model_path": row[3],
            "promoted_at": row[4],
            "notes": row[5],
            "model_type": row[6],
            "mae": row[7],
            "rmse": row[8],
            "r2": row[9],
            "trained_at": row[10]
        })

    return {"models": models}


def promote_model(registry_id: int):
    """
    Promote a model to production.
    Demote any currently active production model first.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM model_registry WHERE id = ?
    """, (registry_id,))

    model = cursor.fetchone()
    if not model:
        conn.close()
        return {"success": False, "message": "Model not found"}

    cursor.execute("""
        UPDATE model_registry
        SET status = 'staging'
        WHERE status = 'production'
    """)

    cursor.execute("""
        UPDATE model_registry
        SET status = 'production', promoted_at = ?
        WHERE id = ?
    """, (datetime.now().isoformat(), registry_id))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Model {registry_id} promoted to production",
        "promoted_at": datetime.now().isoformat()
    }


def rollback_model():
    """
    Rollback — demote current production model,
    promote the most recent staging model.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM model_registry WHERE status = 'production'
    """)
    current = cursor.fetchone()

    if not current:
        conn.close()
        return {"success": False, "message": "No production model found"}

    
    cursor.execute("""
        UPDATE model_registry SET status = 'experimental'
        WHERE status = 'production'
    """)


    cursor.execute("""
        SELECT id FROM model_registry
        WHERE status = 'staging'
        ORDER BY id DESC LIMIT 1
    """)
    previous = cursor.fetchone()

    if previous:
        cursor.execute("""
            UPDATE model_registry
            SET status = 'production', promoted_at = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), previous[0]))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Rolled back to previous model"}

    conn.commit()
    conn.close()
    return {"success": False, "message": "No staging model to rollback to"}


def get_production_model():
    """Get current production model details"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.id, m.version, m.model_path, m.status,
               e.model_type, e.mae, e.rmse, e.r2, e.feature_list
        FROM model_registry m
        JOIN experiments e ON m.experiment_id = e.id
        WHERE m.status = 'production'
        LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    import json
    return {
        "registry_id": row[0],
        "version": row[1],
        "model_path": row[2],
        "status": row[3],
        "model_type": row[4],
        "mae": row[5],
        "rmse": row[6],
        "r2": row[7],
        "feature_list": json.loads(row[8]) if row[8] else []
    }