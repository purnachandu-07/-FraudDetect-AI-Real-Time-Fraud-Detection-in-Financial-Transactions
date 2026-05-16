import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import create_tables
from seed import seed
from ml.train import train_and_save
from database import SessionLocal, ModelMetrics
from ws.feed import manager
from routers import auth, transactions, alerts, models as models_router

import datetime


def store_metrics(metrics: dict):
    db = SessionLocal()
    try:
        # Clear old metrics
        db.query(ModelMetrics).delete()
        for model_name, m in metrics.items():
            db.add(ModelMetrics(
                model_name=model_name,
                accuracy=m["accuracy"],
                precision_score=m["precision"],
                recall=m["recall"],
                f1=m["f1"],
                auc_roc=m["auc_roc"],
            ))
        db.commit()
    finally:
        db.close()


def check_models_exist():
    models_dir = os.path.join(os.path.dirname(__file__), "ml", "saved_models")
    return all(
        os.path.exists(os.path.join(models_dir, f))
        for f in ["rf_model.pkl", "xgb_model.pkl", "scaler.pkl"]
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] Starting FraudWatch API...")
    create_tables()
    seed()
    if not check_models_exist():
        print("[ML] Training ML models (first run)...")
        metrics = train_and_save()
        store_metrics(metrics)
    else:
        print("[OK] ML models already trained.")
    yield
    print("[*] Shutting down FraudWatch API...")


app = FastAPI(
    title="FraudWatch API",
    description="Real-time fraud detection powered by ML",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(models_router.router)


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — wait for any client ping
            await asyncio.wait_for(websocket.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError, Exception):
        manager.disconnect(websocket)
