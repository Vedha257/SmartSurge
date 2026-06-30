import os
from datetime import datetime
from services.ingestion_service import ingest_dataset
from services.validation_service import validate_dataset
from services.feature_service import engineer_features
from services.training_service import train_models
from services.evaluation_service import get_evaluation_results
from services.registry_service import promote_model, get_registry
from database.db import get_connection

def run_full_pipeline(file_path: str, filename: str) -> dict:
    """
    Run all 6 pipeline stages automatically in sequence.
    Returns status of each stage + final result.
    """
    stages = []
    dataset_id = None

    def log_stage(name, status, result=None, error=None):
        stages.append({
            "stage": name,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "result": result,
            "error": error
        })

    try:
        print("AUTO PIPELINE: Stage 1 — Ingestion")
        ingest_result = ingest_dataset(file_path, filename)
        dataset_id = ingest_result['dataset_id']
        log_stage("ingestion", "complete", {
            "rows": ingest_result['rows'],
            "columns": ingest_result['columns'],
            "dataset_id": dataset_id
        })
    except Exception as e:
        log_stage("ingestion", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Ingestion failed: {e}"}

   
    try:
        print("AUTO PIPELINE: Stage 2 — Validation")
        merged_path = f"uploads/merged_{dataset_id}.csv"
        val_result = validate_dataset(dataset_id, merged_path)
        if val_result['quality_score'] < 60:
            log_stage("validation", "failed",
                      error=f"Quality score too low: {val_result['quality_score']}/100")
            return {
                "success": False, "stages": stages,
                "error": f"Data quality score {val_result['quality_score']}/100 — minimum 60 required"
            }
        log_stage("validation", "complete", {
            "quality_score": val_result['quality_score'],
            "missing_pct": val_result['total_missing_pct']
        })
    except Exception as e:
        log_stage("validation", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Validation failed: {e}"}

  
    try:
        print("AUTO PIPELINE: Stage 3 — Feature Engineering")
        eng_result = engineer_features(dataset_id, merged_path)
        log_stage("feature_engineering", "complete", {
            "original_rows": eng_result['original_shape']['rows'],
            "engineered_rows": eng_result['engineered_shape']['rows'],
            "features_created": len(eng_result['features_created'])
        })
    except Exception as e:
        log_stage("feature_engineering", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Feature engineering failed: {e}"}

   
    try:
        print("AUTO PIPELINE: Stage 4 — Training (this takes a few minutes...)")
        engineered_path = f"uploads/engineered_{dataset_id}.csv"
        train_result = train_models(dataset_id, engineered_path)
        log_stage("training", "complete", {
            "models_trained": [m['model_type'] for m in train_result['models']],
            "best_model": train_result['best_model'],
            "best_version": train_result['best_version']
        })
    except Exception as e:
        log_stage("training", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Training failed: {e}"}

  
    # STAGE 5 — Evaluation
    try:
        print("AUTO PIPELINE: Stage 5 — Evaluation")
        eval_result = get_evaluation_results(dataset_id)
        log_stage("evaluation", "complete", {
            "best_model": eval_result.get('best_model', 'N/A'),
            "best_version": eval_result.get('best_version', 'N/A'),
            "experiments": len(eval_result.get('experiments', []))
        })
    except Exception as e:
        log_stage("evaluation", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Evaluation failed: {e}"}

    
    try:
        print("AUTO PIPELINE: Stage 6 — Promoting best model")
        registry = get_registry()
        models = registry['models']

      
        best = min(models, key=lambda m: m['rmse'] if m['rmse'] else 999)
        promote_model(best['registry_id'])

        log_stage("registry", "complete", {
            "promoted_model": best['model_type'],
            "version": best['version'],
            "rmse": best['rmse']
        })
    except Exception as e:
        log_stage("registry", "failed", error=str(e))
        return {"success": False, "stages": stages, "error": f"Registry promotion failed: {e}"}

    print("AUTO PIPELINE: Complete!")

    return {
        "success": True,
        "dataset_id": dataset_id,
        "stages": stages,
        "summary": {
            "total_stages": len(stages),
            "completed": len([s for s in stages if s['status'] == 'complete']),
            "best_model": train_result.get('best_model', 'N/A'),
            "best_version": train_result.get('best_version', 'N/A'),
            "message": "Pipeline complete — model promoted to production automatically"
        }
    }