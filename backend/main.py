from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import init_db
import os

app = FastAPI(title="SmartSurge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("models", exist_ok=True)
os.makedirs("database", exist_ok=True)


@app.on_event("startup")
async def startup_event():
    init_db()

    try:
        from services.predict_service import get_model
        model, info = get_model()
        print(f"✓ Production model loaded: {info['model_type']} {info['version']}")
    except Exception as e:
        print(f"⚠ No production model found yet: {e}")

    print("SmartSurge API started")


@app.get("/health")
def health_check():
    return {"status": "SmartSurge API is running", "version": "1.0.0"}


from routers import pipeline
from routers import predict
from routers import monitor

app.include_router(pipeline.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(monitor.router, prefix="/api")