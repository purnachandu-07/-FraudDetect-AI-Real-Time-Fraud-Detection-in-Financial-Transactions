from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./fraud_detection.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="analyst")  # admin | analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String, unique=True, index=True)
    amount = Column(Float)
    merchant = Column(String)
    merchant_category = Column(String)
    card_last4 = Column(String)
    location = Column(String)
    is_foreign = Column(Boolean, default=False)
    device_mismatch = Column(Boolean, default=False)
    velocity_1h = Column(Integer, default=1)
    geo_distance = Column(Float, default=0.0)
    hour_of_day = Column(Integer, default=12)
    day_of_week = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_tier = Column(String, default="LOW")  # LOW | MEDIUM | HIGH | CRITICAL
    is_fraud = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    model_used = Column(String, default="xgboost")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String, index=True)
    amount = Column(Float)
    merchant = Column(String)
    merchant_category = Column(String)
    card_last4 = Column(String)
    location = Column(String)
    risk_score = Column(Float)
    risk_tier = Column(String)
    status = Column(String, default="pending")  # pending | investigating | dismissed | blocked
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class ModelMetrics(Base):
    __tablename__ = "model_metrics"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    accuracy = Column(Float)
    precision_score = Column(Float)
    recall = Column(Float)
    f1 = Column(Float)
    auc_roc = Column(Float)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
