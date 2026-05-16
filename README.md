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

---

## 🤝 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/) — Sebastián Ramírez
- [XGBoost](https://xgboost.readthedocs.io/) — DMLC team
- [scikit-learn](https://scikit-learn.org/) — scikit-learn developers
- [imbalanced-learn](https://imbalanced-learn.org/) — SMOTE implementation
- [Recharts](https://recharts.org/) — charting library

---

## 📄 License

MIT License — free to use, modify, and distribute for personal and commercial projects.
