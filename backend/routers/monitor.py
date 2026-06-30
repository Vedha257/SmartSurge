from fastapi import APIRouter, HTTPException
from services.drift_service import (
    run_drift_detection, get_monitor_stats,
    get_surge_trend, get_prediction_log
)

router = APIRouter()

@router.get("/monitor/stats/{dataset_id}")
def monitor_stats(dataset_id: int):
    try:
        result = get_monitor_stats(dataset_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monitor/drift/{dataset_id}")
def detect_drift(dataset_id: int):
    try:
        result = run_drift_detection(dataset_id)
        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        print("DRIFT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor/trend")
def surge_trend():
    try:
        result = get_surge_trend()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor/predictions")
def prediction_log():
    try:
        result = get_prediction_log()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

