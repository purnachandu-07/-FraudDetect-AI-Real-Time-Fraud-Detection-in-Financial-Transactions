from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ModelMetrics
from auth import get_current_user
from typing import List
import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/models", tags=["models"])


class MetricsOut(BaseModel):
    id: int
    model_name: str
    accuracy: float
    precision_score: float
    recall: float
    f1: float
    auc_roc: float
    trained_at: datetime.datetime

    class Config:
        from_attributes = True


@router.get("/metrics", response_model=List[MetricsOut])
def get_metrics(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(ModelMetrics).order_by(ModelMetrics.trained_at.desc()).all()
