import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, create_tables, User
from auth import get_password_hash


def seed():
    create_tables()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@fraudwatch.ai").first()
        if not existing:
            admin = User(
                email="admin@fraudwatch.ai",
                username="Admin",
                hashed_password=get_password_hash("Admin@1234"),
                role="admin",
            )
            analyst = User(
                email="analyst@fraudwatch.ai",
                username="Analyst",
                hashed_password=get_password_hash("Analyst@1234"),
                role="analyst",
            )
            db.add(admin)
            db.add(analyst)
            db.commit()
            print("[OK] Seeded default users:")
            print("   Admin   -> admin@fraudwatch.ai    / Admin@1234")
            print("   Analyst -> analyst@fraudwatch.ai / Analyst@1234")
        else:
            print("[i]  Users already seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
