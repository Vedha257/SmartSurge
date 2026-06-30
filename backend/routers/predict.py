from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.predict_service import predict_surge
from services.shap_service import explain_prediction

router = APIRouter()

class RideInput(BaseModel):
    hour_of_day: int = 8
    day_of_week: int = 0
    month: int = 6
    weather: str = "clear"
    distance: float = 2.0
    cab_type: str = "UberX"
    source: str = "Downtown"
    destination: str = "Airport"
    demand_proxy: int = 50
    event_nearby: int = 0
    temp: float = 60.0
    rain: float = 0.0
    clouds: float = 20.0
    wind: float = 5.0
    humidity: float = 0.5


@router.post("/predict")
def predict(input_data: RideInput):
    try:
        data = input_data.dict()
        # Get surge prediction
        result = predict_surge(data)
        # Get SHAP explanation
        shap_result = explain_prediction(data)
        return {
            "success": True,
            "data": {**result, **shap_result}
        }
    except Exception as e:
        import traceback
        print("PREDICT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate")
def simulate(input_data: RideInput):
    """
    Same as predict but no SHAP — faster for real-time slider updates
    """
    try:
        data = input_data.dict()
        result = predict_surge(data)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))