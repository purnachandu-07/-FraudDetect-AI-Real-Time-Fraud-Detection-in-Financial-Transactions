# Fraud Detection — Setup & Run Guide

## Project Structure

```
fraud_detection/
├── backend/       ← Python / FastAPI
└── frontend/      ← Node.js / React (or similar)
```

---

## Backend Setup

### 1. Navigate to backend
```bash
cd fraud_detection
cd backend
```

### 2. Create & activate a virtual environment (recommended)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

> If you don't have a `requirements.txt` yet, install the core packages manually:
```bash
pip install fastapi uvicorn[standard]
```

### 4. Run the backend server
```bash
python -m uvicorn main:app --reload
```

- API will be available at: **http://127.0.0.1:8000**
- Swagger docs: **http://127.0.0.1:8000/docs**

---

## Frontend Setup

### 1. Navigate to frontend
```bash
cd fraud_detection
cd frontend
```

### 2. Install Node modules
```bash
npm install
```

> This reads `package.json` and installs all dependencies into `node_modules/`.

### 3. Run the development server
```bash
npm run dev
```

- Frontend will be available at: **http://localhost:5173** (Vite default) or **http://localhost:3000** (CRA default)

---

## Quick Start (Run Both Together)

Open **two terminals** and run each simultaneously:

**Terminal 1 — Backend:**
```bash
cd fraud_detection/backend
source venv/bin/activate      # skip on Windows: use venv\Scripts\activate
python -m uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd fraud_detection/frontend
npm install                   # only needed first time
npm run dev
```

---

## Requirements Summary

| Layer    | Tool / Command                          | Purpose                        |
|----------|-----------------------------------------|--------------------------------|
| Backend  | `python -m venv venv`                   | Create virtual environment     |
| Backend  | `pip install -r requirements.txt`       | Install Python packages        |
| Backend  | `python -m uvicorn main:app --reload`   | Start FastAPI server           |
| Frontend | `npm install`                           | Install Node.js dependencies   |
| Frontend | `npm run dev`                           | Start frontend dev server      |

---

## Prerequisites

Make sure these are installed on your system before starting:

- **Python 3.8+** — https://www.python.org/downloads/
- **Node.js 16+** — https://nodejs.org/
- **npm** (comes bundled with Node.js)

Check versions:
```bash
python --version
node --version
npm --version
```
