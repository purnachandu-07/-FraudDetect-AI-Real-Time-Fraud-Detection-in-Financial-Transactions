# 🔐 FraudDetect AI — Real-Time Fraud Detection System

A full-stack, ML-powered fraud detection dashboard that scores financial transactions in real time using **XGBoost** and **Random Forest** models, with live WebSocket feeds, alert management, and an interactive React frontend.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI + Uvicorn |
| **ML Models** | XGBoost, Random Forest (scikit-learn) |
| **Database** | SQLite via SQLAlchemy ORM |
| **Auth** | JWT (python-jose + passlib) |
| **Real-time** | WebSocket (`/ws/feed`) |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Charts** | Recharts + Chart.js |

---

## ✨ Features

- **Real-time transaction scoring** — every transaction is assigned a risk score (0–100) and tier: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`
- **Dual ML models** — switch between XGBoost and Random Forest on the fly
- **Live WebSocket feed** — the dashboard updates instantly as transactions are simulated or submitted
- **Manual transaction entry** — test any combination of inputs and see the prediction immediately
- **Alert management** — flagged transactions flow into an alerts queue with `pending → investigating → dismissed / blocked` statuses
- **Analytics & trends** — fraud rate over time, risk-tier distribution, and model performance metrics
- **Role-based access** — `admin` and `analyst` roles with JWT authentication
- **Auto-training** — models train automatically on first run; subsequent starts load saved models from disk

---

## 📁 Project Structure

```
fraud_detection/
├── backend/
│   ├── main.py              # FastAPI app, startup, WebSocket endpoint
│   ├── database.py          # SQLAlchemy models (User, Transaction, Alert, ModelMetrics)
│   ├── auth.py              # JWT helpers
│   ├── seed.py              # Default admin/analyst users
│   ├── seed_transactions.py # Sample transaction seeder
│   ├── ml/
│   │   ├── train.py         # Model training (XGBoost + RF + SMOTE balancing)
│   │   ├── predictor.py     # Inference: load models, score a transaction
│   │   └── saved_models/    # rf_model.pkl, xgb_model.pkl, scaler.pkl
│   ├── routers/
│   │   ├── auth.py          # POST /api/auth/login, /register
│   │   ├── transactions.py  # GET/POST /api/transactions (simulate, manual, stats, trend)
│   │   ├── alerts.py        # GET/PATCH /api/alerts
│   │   └── models.py        # GET /api/models/metrics
│   └── ws/
│       └── feed.py          # WebSocket connection manager
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, LiveFeed, Alerts, Analytics, Settings, Login
│   │   ├── components/      # Navbar, Sidebar, KPICard, RiskBadge, FraudGauge
│   │   ├── context/         # Auth context (JWT storage + refresh)
│   │   └── services/        # Axios API client
│   ├── package.json
│   └── vite.config.js
└── requirements.txt         # Backend Python dependencies
```

---

## ⚙️ ML Features

Each transaction is scored on 8 features:

| Feature | Description |
|---|---|
| `amount` | Transaction amount in USD |
| `merchant_category` | Encoded category (retail, travel, crypto, etc.) |
| `hour_of_day` | 0–23; late-night hours elevate risk |
| `day_of_week` | 0 = Monday … 6 = Sunday |
| `velocity_1h` | Number of transactions in the past hour |
| `geo_distance` | Distance from home location (km) |
| `is_foreign` | Foreign transaction flag |
| `device_mismatch` | Device fingerprint doesn't match previous sessions |

**Risk tiers:**

| Score | Tier |
|---|---|
| ≥ 85 | 🔴 CRITICAL |
| 65 – 84 | 🟠 HIGH |
| 40 – 64 | 🟡 MEDIUM |
| < 40 | 🟢 LOW |

Fraud is flagged when score ≥ 0.65 (65%). Training uses **SMOTE** oversampling to handle class imbalance.

---

## 🛠️ Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/your-username/fraudwatch.git
cd fraudwatch
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate
# Windows
venv\Scripts\activate

pip install --upgrade pip
pip install -r ../requirements.txt
```

### 3. Start the backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

On first run:
- SQLite database and all tables are created automatically
- Default seed users are inserted (see [Default Credentials](#default-credentials))
- ML models train automatically — this takes 10–60 seconds depending on hardware
- Subsequent starts skip training and load the saved models instantly

Expected output:
```
[*] Starting FraudWatch API...
[ML] Training ML models (first run)...
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

### 4. Set up and start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

### 5. Open the app

Navigate to **http://localhost:5173** and log in with the default credentials below.

> On Windows, you can also use `start.bat` from the project root to launch both servers.

---

## 🔑 Default Credentials

| Role | Username / Email | Password |
|---|---|---|
| Admin | `admin@fraudwatch.com` | `admin123` |
| Analyst | `analyst@fraudwatch.com` | `analyst123` |

> **Change these before deploying to production.** Update `backend/seed.py` and re-run, or set credentials via environment variables.

---

## 📡 API Reference

Full interactive docs available at **http://localhost:8001/docs** (Swagger) and **http://localhost:8001/redoc**.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `POST` | `/api/auth/register` | Register a new user |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions/` | List transactions (filterable by `risk_tier`) |
| `GET` | `/api/transactions/stats` | Total, flagged, blocked counts + fraud rate |
| `GET` | `/api/transactions/trend?days=7` | Daily fraud trend for the past N days |
| `POST` | `/api/transactions/simulate` | Simulate a random transaction (optionally force fraud) |
| `POST` | `/api/transactions/manual` | Score a manually entered transaction |

**Simulate endpoint params (query string):**
```
model_name=xgboost|random_forest
force_fraud=true|false
```

**Manual transaction body:**
```json
{
  "amount": 4500.00,
  "merchant": "Crypto Exchange X",
  "merchant_category": "crypto",
  "card_last4": "9821",
  "location": "Lagos, Nigeria",
  "is_foreign": true,
  "device_mismatch": true,
  "velocity_1h": 12,
  "geo_distance": 2500.0,
  "model_name": "xgboost"
}
```

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts/` | List all fraud alerts |
| `PATCH` | `/api/alerts/{id}` | Update alert status |

### Models

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/models/metrics` | Accuracy, precision, recall, F1, AUC-ROC for both models |

### Health

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/health` | `{"status": "ok", "timestamp": "..."}` |

### WebSocket

```
ws://localhost:8001/ws/feed
```

Broadcasts a JSON message every time a transaction is simulated or submitted:
```json
{
  "type": "transaction",
  "data": {
    "tx_id": "TX4A9F1C2B3D",
    "amount": 8200.00,
    "risk_score": 91.3,
    "risk_tier": "CRITICAL",
    "is_fraud": true,
    ...
  }
}
```

---

## 🖥️ Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | KPI cards, fraud rate chart, recent transactions |
| `/live` | Live Feed | Real-time transaction stream via WebSocket |
| `/alerts` | Alerts | Fraud alert queue with status management |
| `/analytics` | Analytics | Trend charts, tier distribution, model metrics |
| `/settings` | Settings | Model selector, simulation controls |
| `/login` | Login | JWT authentication |

---

## 🔒 Security Notes

- All routes (except `/health` and `/api/auth/login`) require a valid JWT Bearer token
- Tokens are issued on login and must be sent as `Authorization: Bearer <token>`
- Passwords are hashed with bcrypt via passlib
- The SQLite database is local only — **do not expose port 8001 publicly without adding proper auth middleware**

---

## 🧪 Running a Quick Test

After both servers are up:

1. Log in at **http://localhost:5173/login**
2. Go to **Settings** → click **Simulate Transaction** a few times
3. Switch to **Live Feed** to watch transactions arrive in real time
4. Open **Alerts** to see any flagged CRITICAL/HIGH transactions
5. Visit **http://localhost:8001/docs** to test the API directly in the browser

---

## 🚀 Deployment Notes

For production:

- Replace SQLite with **PostgreSQL** (update `SQLALCHEMY_DATABASE_URL` in `database.py`)
- Set a strong `SECRET_KEY` for JWT signing (currently hardcoded in `auth.py`)
- Run behind a reverse proxy (nginx/caddy) with HTTPS
- Build the frontend: `npm run build` and serve `dist/` as static files
- Use environment variables for all secrets

---

## 📦 Backend Dependencies

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
scikit-learn==1.4.2
xgboost==2.0.3
imbalanced-learn==0.12.2
numpy==1.26.4
pandas==2.2.2
pydantic==2.7.1
websockets==12.0
```

## 📦 Frontend Dependencies

```
react ^18.3.1
react-router-dom ^6.23.1
axios ^1.7.2
recharts ^2.12.7
chart.js ^4.4.3
lucide-react ^0.395.0
tailwindcss ^3.4.4
vite ^5.3.1
```
## Troubleshooting
| Problem                                    | Likely Cause                                              | Solution                                                                  |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Backend won't start                        | Port 8001 already in use                                  | Kill the existing process using the port and restart the backend          |
| Frontend won't start                       | Port 5173 already in use                                  | Run frontend on another port using `npm run dev -- --port 5174`           |
| ModuleNotFoundError on backend start       | Virtual environment not activated or dependencies missing | Activate the venv and run `pip install -r requirements.txt`               |
| No module named 'xgboost'                  | XGBoost dependency not installed                          | Run `pip install xgboost==2.0.3` inside the virtual environment           |
| ML models not found on startup             | `saved_models/` folder missing or empty                   | Delete the folder and restart — models retrain automatically              |
| Training hangs for more than 5 minutes     | Large dataset or slow CPU                                 | Wait during first training; later startups skip retraining                |
| 401 Unauthorized on API calls              | JWT token missing or expired                              | Log out and log in again to refresh the token                             |
| Login fails with correct credentials       | Seed users not inserted properly                          | Ensure backend startup completed successfully so seed data runs           |
| Live Feed shows no transactions            | WebSocket connection failed                               | Check browser console for WebSocket errors and confirm backend is running |
| Dashboard statistics show zero             | No transaction data available                             | Simulate transactions from the dashboard/settings panel                   |
| UNIQUE constraint failed: transactions     | Duplicate transaction ID insertion                        | Safe to ignore — duplicate prevention is working correctly                |
| CORS error in browser console              | Frontend URL not allowed in backend                       | Add frontend URL to `allow_origins` inside `main.py`                      |
| 422 Unprocessable Entity                   | API request body schema mismatch                          | Verify request payload using Swagger docs at `/docs`                      |
| Vite build fails                           | Old Node.js version                                       | Upgrade to Node.js 18 or later                                            |
| SQLite database locked                     | Multiple backend instances running                        | Stop all running uvicorn processes and restart only one instance          |
| Fraud prediction always returns legitimate | Poor training dataset balance                             | Retrain the model using balanced fraud samples                            |
| WebSocket disconnects frequently           | Backend restart or unstable connection                    | Restart backend and reconnect frontend WebSocket client                   |
| Slow API response                          | Heavy ML prediction processing                            | Use async routes and optimize preprocessing pipeline                      |
| Transactions not saving                    | Database session commit failure                           | Check SQLAlchemy session handling and DB connection                       |
| Frontend API calls failing                 | Incorrect backend API URL                                 | Verify API base URL in frontend configuration                             |
| Model accuracy is too low                  | Insufficient feature engineering                          | Improve preprocessing and retrain the ML model                            |
| Real-time alerts not appearing             | WebSocket client not initialized                          | Ensure frontend WebSocket connection starts on page load                  |

❓ FAQ
Q: Does this work offline?
Yes — after installing dependencies, the system runs entirely locally. No internet connection is required.
Q: Where is the data stored?
All transaction, alert, user, and model metric data is stored in backend/fraud_detection.db (SQLite). The trained ML models are in backend/ml/saved_models/. Neither is committed to git by default.
Q: Can I reset all data and start fresh?
Delete backend/fraud_detection.db and all .pkl files in backend/ml/saved_models/. The database and models will be recreated automatically on the next backend start.
Q: How do I switch between XGBoost and Random Forest?
In the frontend, go to Settings and select the model before simulating. For the API, pass model_name=xgboost or model_name=random_forest as a query parameter to /api/transactions/simulate, or include "model_name" in a manual transaction request body.
Q: How accurate are the models?
Performance depends on the synthetic training data. Typical results on the test split: XGBoost AUC-ROC ~0.95+, Random Forest ~0.93+. View live metrics on the Analytics page or at /api/models/metrics.
Q: Can I use real transaction data instead of simulated data?
Yes — use the POST /api/transactions/manual endpoint to submit real transactions, or modify backend/seed_transactions.py to load from a CSV file.
Q: How do I add a new user role?
Update the role column logic in backend/auth.py and backend/database.py, then add role checks to the relevant router endpoints using Depends(get_current_user).
Q: How do I back up the data?
Copy backend/fraud_detection.db and backend/ml/saved_models/. That's the complete data set.
Q: Why do some simulated transactions never get flagged?
The simulator uses an 8% fraud rate by default. Use force_fraud=true in the simulate endpoint to guarantee a fraudulent transaction, or lower the risk thresholds in backend/ml/predictor.py.

🤝 Acknowledgements

FastAPI — Sebastián Ramírez
XGBoost — DMLC team
scikit-learn — scikit-learn developers
imbalanced-learn — SMOTE implementation
Recharts — charting library


📄 License
MIT License — free to use, modify, and distribute for personal and commercial projects.
