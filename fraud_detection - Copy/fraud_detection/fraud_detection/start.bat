@echo off
title FraudWatch — AI Fraud Detection System
color 0A

echo.
echo  ====================================================
echo    FraudWatch — Real-Time Fraud Detection System
echo  ====================================================
echo.

:: ── Step 1: Install Python dependencies ──────────────────────────────────────
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] pip install failed. Make sure Python 3.10+ is installed and in PATH.
    pause & exit /b 1
)
echo       Done.

:: ── Step 2: Install Node dependencies ────────────────────────────────────────
echo [2/4] Installing Node.js dependencies...
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Make sure Node.js 18+ is installed.
    cd ..
    pause & exit /b 1
)
cd ..
echo       Done.

:: ── Step 3: Start FastAPI backend ────────────────────────────────────────────
echo [3/4] Starting FastAPI backend (port 8000)...
echo       [First run will train ML models — this may take 1-2 minutes]
start "FraudWatch Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to be ready
echo       Waiting for backend to start...
timeout /t 8 /nobreak > nul

:: ── Step 4: Start React frontend ─────────────────────────────────────────────
echo [4/4] Starting React frontend (port 5173)...
start "FraudWatch Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak > nul

:: ── Open browser ─────────────────────────────────────────────────────────────
echo.
echo  ====================================================
echo    Application is running!
echo    Frontend : http://localhost:5173
echo    Backend  : http://localhost:8000
echo    API Docs : http://localhost:8000/docs
echo  ====================================================
echo.
echo    Default login:
echo    Email    : admin@fraudwatch.ai
echo    Password : Admin@1234
echo.
echo    Press any key to open the browser...
pause > nul
start http://localhost:5173

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the application.
echo.
pause
