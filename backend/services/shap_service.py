import shap
import pandas as pd
import numpy as np
from services.predict_service import get_model, build_input_features
import traceback


_cached_explainer = None
_cached_explainer_version = None


FEATURE_LABELS = {
    'hour_of_day': 'Hour of Day',
    'day_of_week': 'Day of Week',
    'month': 'Month',
    'rush_hour': 'Rush Hour',
    'weekend': 'Weekend',
    'weather_bin': 'Weather',
    'distance': 'Distance',
    'distance_bin': 'Distance Category',
    'cab_type_encoded': 'Cab Type',
    'source_encoded': 'Pickup Zone',
    'destination_encoded': 'Drop Zone',
    'demand_proxy': 'Demand Level',
    'event_nearby': 'Event Nearby',
    'temp': 'Temperature',
    'rain': 'Rainfall',
    'clouds': 'Cloud Cover',
    'wind': 'Wind Speed',
    'humidity': 'Humidity'
}

def get_explainer():
    """Build SHAP explainer for current production model"""
    global _cached_explainer, _cached_explainer_version

    model, prod_info = get_model()

    if _cached_explainer_version != prod_info['version']:
        print("Building SHAP explainer...")
        _cached_explainer = shap.TreeExplainer(model)
        _cached_explainer_version = prod_info['version']
        print("SHAP explainer ready")

    return _cached_explainer


def explain_prediction(input_data: dict) -> dict:
    """
    Generate SHAP values for a single prediction.
    Returns top features with their contribution values.
    """
    try:
        explainer = get_explainer()
        input_df = build_input_features(input_data)

        shap_result = explainer(input_df)

        values = shap_result.values[0]
        feature_names = input_df.columns.tolist()

                
        explanations = []
        for i, (fname, fval) in enumerate(zip(feature_names, values)):
            explanations.append({
                "feature": fname,
                "label": FEATURE_LABELS.get(fname, fname),
                "shap_value": round(float(fval), 4),
                "direction": "increases" if fval > 0 else "decreases"
            })

     
        
        explanations.sort(
            key=lambda x: abs(x["shap_value"]),
            reverse=True
        )

        top_explanations = explanations[:8]

      
        base_value = float(shap_result.base_values[0])

        return {
            "explanations": top_explanations,
            "base_value": round(base_value, 4)
        }


    except Exception:
        traceback.print_exc()
        return {
            "explanations": [],
            "base_value": 1.0
        }
        