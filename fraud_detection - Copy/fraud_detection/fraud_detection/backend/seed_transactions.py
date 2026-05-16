import sys
import os
import random
import datetime
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Transaction, Alert
from ml.predictor import predict

MERCHANTS = [
    ("Amazon", "retail"), ("Walmart", "retail"), ("Netflix", "entertainment"),
    ("Uber", "transport"), ("Delta Airlines", "travel"), ("Shell Gas", "fuel"),
    ("McDonald's", "food"), ("CVS Pharmacy", "health"), ("Best Buy", "electronics"),
    ("Casino Royal", "gambling"), ("Crypto Exchange X", "crypto"),
    ("Luxury Boutique", "luxury"), ("International Wire", "wire"), ("ATM Withdrawal", "cash"),
]

CATEGORY_MAP = {
    "retail": 0, "entertainment": 1, "transport": 2, "travel": 3,
    "fuel": 4, "food": 5, "health": 6, "electronics": 7,
    "gambling": 7, "crypto": 7, "luxury": 7, "wire": 3, "cash": 4,
}

LOCATIONS = [
    "New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA",
    "London, UK", "Tokyo, Japan", "Dubai, UAE", "Moscow, Russia",
    "Lagos, Nigeria", "São Paulo, Brazil", "Sydney, Australia",
]

def seed_transactions(count=500):
    db = SessionLocal()
    try:
        print(f"Seeding {count} transactions...")
        
        # Clear existing transactions if needed (optional, but let's just add)
        # db.query(Transaction).delete()
        # db.query(Alert).delete()
        
        now = datetime.datetime.utcnow()
        
        for i in range(count):
            # Spread transactions over the last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            ts = now - datetime.timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            is_suspicious = random.random() < 0.12
            merchant_name, merchant_cat = random.choice(MERCHANTS)
            cat_id = CATEGORY_MAP.get(merchant_cat, 0)
            
            if is_suspicious:
                amount = round(random.uniform(500, 15000), 2)
                hour = random.choice([0, 1, 2, 3, 4, 22, 23])
                velocity = random.randint(8, 25)
                geo_dist = round(random.uniform(300, 3000), 1)
                is_foreign = random.random() < 0.75
                dev_mismatch = random.random() < 0.80
            else:
                amount = round(random.uniform(5, 800), 2)
                hour = ts.hour
                velocity = random.randint(1, 3)
                geo_dist = round(random.uniform(0, 50), 1)
                is_foreign = random.random() < 0.05
                dev_mismatch = random.random() < 0.03

            score, is_fraud, tier = predict(
                amount=amount,
                merchant_category=cat_id,
                hour_of_day=hour,
                day_of_week=ts.weekday(),
                velocity_1h=velocity,
                geo_distance=geo_dist,
                is_foreign=int(is_foreign),
                device_mismatch=int(dev_mismatch),
                model_name="xgboost",
            )

            tx = Transaction(
                tx_id=f"TX{uuid.uuid4().hex[:10].upper()}",
                amount=amount,
                merchant=merchant_name,
                merchant_category=merchant_cat,
                card_last4=str(random.randint(1000, 9999)),
                location=random.choice(LOCATIONS),
                is_foreign=is_foreign,
                device_mismatch=dev_mismatch,
                velocity_1h=velocity,
                geo_distance=geo_dist,
                hour_of_day=hour,
                day_of_week=ts.weekday(),
                risk_score=round(score * 100, 2),
                risk_tier=tier,
                is_fraud=is_fraud,
                is_blocked=is_fraud and random.random() < 0.6,
                model_used="xgboost",
                timestamp=ts
            )
            db.add(tx)
            
            if is_fraud:
                alert = Alert(
                    tx_id=tx.tx_id,
                    amount=amount,
                    merchant=merchant_name,
                    merchant_category=merchant_cat,
                    card_last4=tx.card_last4,
                    location=tx.location,
                    risk_score=tx.risk_score,
                    risk_tier=tier,
                    status="blocked" if tx.is_blocked else "pending",
                    created_at=ts
                )
                db.add(alert)
            
            if i % 100 == 0:
                db.commit()
                print(f"Progress: {i}/{count}")
        
        db.commit()
        print("[OK] Seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_transactions()
