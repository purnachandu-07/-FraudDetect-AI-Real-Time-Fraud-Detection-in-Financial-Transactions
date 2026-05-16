from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, Alert
from auth import get_current_user
import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertOut(BaseModel):
    id: int
    tx_id: str
    amount: float
    merchant: str
    merchant_category: str
    card_last4: str
    location: str
    risk_score: float
    risk_tier: str
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: str  # investigating | dismissed | blocked


@router.get("/", response_model=List[AlertOut])
def get_alerts(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    risk_tier: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if risk_tier:
        query = query.filter(Alert.risk_tier == risk_tier)
    return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total = db.query(Alert).count()
    pending = db.query(Alert).filter(Alert.status == "pending").count()
    investigating = db.query(Alert).filter(Alert.status == "investigating").count()
    blocked = db.query(Alert).filter(Alert.status == "blocked").count()
    dismissed = db.query(Alert).filter(Alert.status == "dismissed").count()
    return {
        "total": total,
        "pending": pending,
        "investigating": investigating,
        "blocked": blocked,
        "dismissed": dismissed,
    }


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    update: AlertUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    valid_statuses = {"investigating", "dismissed", "blocked", "pending"}
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = update.status
    alert.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
