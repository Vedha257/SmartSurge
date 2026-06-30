from fastapi import APIRouter, UploadFile, File, HTTPException
from services.ingestion_service import ingest_dataset
from services.validation_service import validate_dataset
from services.feature_service import engineer_features
import shutil
import os
from services.training_service import train_models
from services.evaluation_service import get_evaluation_results
from services.registry_service import get_registry, promote_model, rollback_model

router = APIRouter()

@router.post("/pipeline/ingest")
async def ingest(file: UploadFile = File(...)):
    try:
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = ingest_dataset(file_path, file.filename)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/validate/{dataset_id}")
def validate(dataset_id: int):
    try:
        file_path = f"uploads/merged_{dataset_id}.csv"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404,
                                detail="Dataset file not found")
        result = validate_dataset(dataset_id, file_path)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/engineer/{dataset_id}")
def engineer(dataset_id: int):
    try:
        file_path = f"uploads/merged_{dataset_id}.csv"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404,
                                detail="Dataset file not found")
        result = engineer_features(dataset_id, file_path)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print("FULL ERROR:", error_detail)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/train/{dataset_id}")
def train(dataset_id: int):
    try:
        file_path = f"uploads/engineered_{dataset_id}.csv"
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="Engineered dataset not found. Run feature engineering first."
            )
        result = train_models(dataset_id, file_path)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("TRAINING ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pipeline/evaluate/{dataset_id}")
def evaluate(dataset_id: int):
    try:
        result = get_evaluation_results(dataset_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pipeline/registry")
def registry():
    try:
        result = get_registry()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/promote/{registry_id}")
def promote(registry_id: int):
    try:
        result = promote_model(registry_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/rollback")
def rollback():
    try:
        result = rollback_model()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from services.pipeline_service import run_full_pipeline

@router.post("/pipeline/run-full")
async def run_full(file: UploadFile = File(...)):
    """
    Run the complete pipeline automatically:
    Ingest → Validate → Engineer → Train → Evaluate → Promote
    """
    try:
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = run_full_pipeline(file_path, file.filename)
        return {"success": result['success'], "data": result}
    except Exception as e:
        import traceback
        print("FULL PIPELINE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pipeline/latest-dataset")
def latest_dataset():
    from database.db import get_connection
    conn = get_connection()
    row = conn.execute("""
        SELECT id FROM datasets 
        ORDER BY id DESC LIMIT 1
    """).fetchone()
    conn.close()
    if row:
        return {"dataset_id": row[0]}
    return {"dataset_id": None}