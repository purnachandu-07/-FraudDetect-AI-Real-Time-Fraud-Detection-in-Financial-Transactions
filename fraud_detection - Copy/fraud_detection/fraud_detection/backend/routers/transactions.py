import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import uuid
import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db, Transaction, Alert
from auth import get_current_user
from ml.predictor import predict
from ws.feed import manager

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

MERCHANTS = [
    ("Amazon", "retail"), ("Walmart", "retail"), ("Netflix", "entertainment"),
    ("Uber", "transport"), ("Delta Airlines", "travel"), ("Shell Gas", "fuel"),
    ("McDonald's", "food"), ("CVS Pharmacy", "health"), ("Best Buy", "electronics"),
    ("Casino Royal", "gambling"), ("Crypto Exchange X", "crypto"),
    ("Luxury Boutique", "luxury"), ("International Wire", "wire"), ("ATM Withdrawal", "cash"),
]

LOCATIONS = [
    "New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA",
    "London, UK", "Tokyo, Japan", "Dubai, UAE", "Moscow, Russia",
    "Lagos, Nigeria", "São Paulo, Brazil", "Sydney, Australia",
]

CATEGORY_MAP = {
    "retail": 0, "entertainment": 1, "transport": 2, "travel": 3,
    "fuel": 4, "food": 5, "health": 6, "electronics": 7,
    "gambling": 7, "crypto": 7, "luxury": 7, "wire": 3, "cash": 4,
}


def _make_transaction(model_name: str = "xgboost", force_fraud: bool = False) -> dict:
    is_suspicious = force_fraud or (random.random() < 0.08)

    merchant_name, merchant_cat = random.choice(MERCHANTS)
    cat_id = CATEGORY_MAP.get(merchant_cat, 0)
    now = datetime.datetime.utcnow()

    if is_suspicious:
        amount = round(random.uniform(500, 15000), 2)
        hour = random.choice([0, 1, 2, 3, 4, 22, 23])
        velocity = random.randint(8, 25)
        geo_dist = round(random.uniform(300, 3000), 1)
        is_foreign = random.random() < 0.75
        dev_mismatch = random.random() < 0.80
    else:
        amount = round(random.uniform(5, 800), 2)
        hour = random.randint(7, 21)
        velocity = random.randint(1, 3)
        geo_dist = round(random.uniform(0, 50), 1)
        is_foreign = random.random() < 0.05
        dev_mismatch = random.random() < 0.03

    score, is_fraud, tier = predict(
        amount=amount,
        merchant_category=cat_id,
        hour_of_day=hour,
        day_of_week=now.weekday(),
        velocity_1h=velocity,
        geo_distance=geo_dist,
        is_foreign=int(is_foreign),
        device_mismatch=int(dev_mismatch),
        model_name=model_name,
    )

    return {
        "tx_id": f"TX{uuid.uuid4().hex[:10].upper()}",
        "amount": amount,
        "merchant": merchant_name,
        "merchant_category": merchant_cat,
        "card_last4": str(random.randint(1000, 9999)),
        "location": random.choice(LOCATIONS),
        "is_foreign": is_foreign,
        "device_mismatch": dev_mismatch,
        "velocity_1h": velocity,
        "geo_distance": geo_dist,
        "hour_of_day": hour,
        "day_of_week": now.weekday(),
        "risk_score": round(score * 100, 2),
        "risk_tier": tier,
        "is_fraud": is_fraud,
        "is_blocked": is_fraud and random.random() < 0.6,
        "model_used": model_name,
        "timestamp": now.isoformat(),
    }


class TransactionOut(BaseModel):
    id: int
    tx_id: str
    amount: float
    merchant: str
    merchant_category: str
    card_last4: str
    location: str
    is_foreign: bool
    device_mismatch: bool
    velocity_1h: int
    geo_distance: float
    risk_score: float
    risk_tier: str
    is_fraud: bool
    is_blocked: bool
    model_used: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class ManualTransaction(BaseModel):
    amount: float
    merchant: str
    merchant_category: str
    card_last4: str
    location: str
    is_foreign: bool = False
    device_mismatch: bool = False
    velocity_1h: int = 1
    geo_distance: float = 0.0
    model_name: str = "xgboost"


@router.get("/", response_model=List[TransactionOut])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    risk_tier: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Transaction)
    if risk_tier:
        query = query.filter(Transaction.risk_tier == risk_tier)
    return query.order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total = db.query(Transaction).count()
    flagged = db.query(Transaction).filter(Transaction.is_fraud == True).count()
    blocked = db.query(Transaction).filter(Transaction.is_blocked == True).count()
    fraud_rate = round((flagged / total * 100), 2) if total > 0 else 0
    return {
        "total": total,
        "flagged": flagged,
        "blocked": blocked,
        "fraud_rate": fraud_rate,
    }


@router.get("/trend")
def get_trend(days: int = 7, db: Session = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import func
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    results = (
        db.query(
            func.date(Transaction.timestamp).label("date"),
            func.count(Transaction.id).label("total"),
            func.sum(func.case([(Transaction.is_fraud == True, 1)], else_=0)).label("fraud"),
        )
        .filter(Transaction.timestamp >= cutoff)
        .group_by(func.date(Transaction.timestamp))
        .all()
    )
    return [{"date": str(r.date), "total": r.total, "fraud": r.fraud or 0} for r in results]


@router.post("/simulate")
async def simulate_transaction(
    model_name: str = "xgboost",
    force_fraud: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = _make_transaction(model_name=model_name, force_fraud=force_fraud)
    tx = Transaction(
        tx_id=data["tx_id"],
        amount=data["amount"],
        merchant=data["merchant"],
        merchant_category=data["merchant_category"],
        card_last4=data["card_last4"],
        location=data["location"],
        is_foreign=data["is_foreign"],
        device_mismatch=data["device_mismatch"],
        velocity_1h=data["velocity_1h"],
        geo_distance=data["geo_distance"],
        hour_of_day=data["hour_of_day"],
        day_of_week=data["day_of_week"],
        risk_score=data["risk_score"],
        risk_tier=data["risk_tier"],
        is_fraud=data["is_fraud"],
        is_blocked=data["is_blocked"],
        model_used=data["model_used"],
    )
    db.add(tx)

    if data["is_fraud"]:
        alert = Alert(
            tx_id=data["tx_id"],
            amount=data["amount"],
            merchant=data["merchant"],
            merchant_category=data["merchant_category"],
            card_last4=data["card_last4"],
            location=data["location"],
            risk_score=data["risk_score"],
            risk_tier=data["risk_tier"],
            status="blocked" if data["is_blocked"] else "pending",
        )
        db.add(alert)

    db.commit()

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "transaction",
        "data": {**data, "id": tx.id},
    })
    return {"message": "Transaction simulated", "transaction": data}


@router.post("/manual", response_model=dict)
async def manual_transaction(
    payload: ManualTransaction,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    now = datetime.datetime.utcnow()
    cat_id = CATEGORY_MAP.get(payload.merchant_category, 0)
    score, is_fraud, tier = predict(
        amount=payload.amount,
        merchant_category=cat_id,
        hour_of_day=now.hour,
        day_of_week=now.weekday(),
        velocity_1h=payload.velocity_1h,
        geo_distance=payload.geo_distance,
        is_foreign=int(payload.is_foreign),
        device_mismatch=int(payload.device_mismatch),
        model_name=payload.model_name,
    )
    tx_id = f"MX{uuid.uuid4().hex[:10].upper()}"
    tx = Transaction(
        tx_id=tx_id,
        amount=payload.amount,
        merchant=payload.merchant,
        merchant_category=payload.merchant_category,
        card_last4=payload.card_last4,
        location=payload.location,
        is_foreign=payload.is_foreign,
        device_mismatch=payload.device_mismatch,
        velocity_1h=payload.velocity_1h,
        geo_distance=payload.geo_distance,
        hour_of_day=now.hour,
        day_of_week=now.weekday(),
        risk_score=round(score * 100, 2),
        risk_tier=tier,
        is_fraud=is_fraud,
        is_blocked=False,
        model_used=payload.model_name,
    )
    db.add(tx)
    if is_fraud:
        db.add(Alert(
            tx_id=tx_id, amount=payload.amount, merchant=payload.merchant,
            merchant_category=payload.merchant_category, card_last4=payload.card_last4,
            location=payload.location, risk_score=round(score * 100, 2), risk_tier=tier,
        ))
    db.commit()

    result = {
        "tx_id": tx_id, "risk_score": round(score * 100, 2),
        "risk_tier": tier, "is_fraud": is_fraud,
    }
    await manager.broadcast({"type": "transaction", "data": result})
    return result
