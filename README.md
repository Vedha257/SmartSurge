# ⚡ SmartSurge

**Ride-sharing Dynamic Pricing · Full-Stack ML Pipeline Platform**

SmartSurge predicts ride-sharing surge prices, explains predictions using SHAP, simulates what-if pricing scenarios in real time, and monitors model drift over time — built end-to-end to demonstrate production ML engineering.

🔗 **[Live Demo](https://smart-surge.vercel.app)** · **[API Docs](https://smartsurge-api.onrender.com/docs)**

---

## The Problem

Ride-sharing platforms like Uber and Ola use dynamic pricing — prices surge 2–3× during peak hours, bad weather, or high demand. This isn't random; it's driven by ML models processing real-time signals.

SmartSurge replicates this system: a complete ML pipeline from data ingestion to a live REST API with explainability and drift monitoring.

---

## Architecture

Raw CSV Data
↓
Stage 1 · Data Ingestion      → parse, merge, log to SQLite
Stage 2 · Data Validation     → schema, nulls, outliers, quality score
Stage 3 · Feature Engineering → 12 engineered features
Stage 4 · Model Training      → XGBoost + Random Forest
Stage 5 · Evaluation          → MAE, RMSE, R² comparison
Stage 6 · Model Registry      → version, promote, rollback
Stage 7 · Model Serving       → FastAPI + SHAP + what-if simulator
Stage 8 · Drift Monitoring    → KS test on input distributions

Pipeline can run via **one-click Auto Pipeline** or **step-by-step Manual Pipeline** — both fully tracked in SQLite.

---

## Features

**⚙️ ML Pipeline Dashboard** — 8-stage pipeline with full experiment logging, every run/model/prediction tracked automatically.

**⚡ Surge Predictor** — Input ride parameters, get instant surge prediction with SHAP explainability showing exactly which factors drove the price.

**🎛 What-if Simulator** — Interactive sliders update surge price in real time, showing the impact of weather, demand, and events instantly.

**📡 Drift Monitor** — KS test compares recent prediction inputs against training distributions, flagging when retraining may be needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Models | XGBoost, Random Forest (scikit-learn) |
| Explainability | SHAP (TreeExplainer) |
| Drift Detection | KS test (scipy) |
| Backend | FastAPI + Uvicorn |
| Database | SQLite |
| Frontend | React 18 + Custom CSS |
| Charts | Recharts |
| Deployment | Render (API) + Vercel (UI) |
| Containerization | Docker + Docker Compose |

---

## Dataset

**Uber & Lyft Cab Prices** — Kaggle, 1.26M ride records with weather, location, and surge multiplier data. 12 features engineered including `rush_hour`, `weather_bin`, `demand_proxy`, and `event_nearby`.

---

## ML Results

| Model | MAE | RMSE | R² |
|---|---|---|---|
| XGBoost | 0.0247 | 0.0861 | 0.104 |
| **Random Forest** ⭐ | **0.0239** | **0.0856** | **0.1159** |

Random Forest promoted to production based on lower RMSE.

---

## Production vs Portfolio

| Aspect | This Project | Production (Uber/Ola) |
|---|---|---|
| Data source | Historical Kaggle CSV | Live GPS + weather streams |
| Pipeline trigger | Manual / one-click | Automated (Airflow/Kafka) |
| Event detection | Binary feature toggle | Real event APIs |
| Storage | SQLite | PostgreSQL + model store |

The pipeline architecture is identical — only the data source and automation layer differ in production.

---

## Local Setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Or with Docker:
```bash
docker-compose up --build
```

---

## Future Improvements

- Drift-triggered automated retraining (APScheduler)
- MLflow for richer experiment tracking
- PostgreSQL for production-scale logging
- Real-time data ingestion via Kafka
- A/B testing between model versions

---

