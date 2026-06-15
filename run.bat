@echo off
title ShopVibe AI Support Center Setup
echo ==================================================
echo        ShopVibe AI Support Center Setup
echo ==================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not found in your environment PATH.
    echo Please install Python (3.8+) before running this script.
    pause
    exit /b 1
)

if not exist .venv (
    echo [INFO] Creating Python virtual environment (.venv)...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo [INFO] Upgrading pip and installing requirements...
call .venv\Scripts\python -m pip install --upgrade pip
call .venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo [SUCCESS] Starting FastAPI Server...
echo [INFO] Open http://127.0.0.1:8000 in your browser.
echo [INFO] Press Ctrl+C to terminate.

start http://127.0.0.1:8000
.venv\Scripts\python -m uvicorn main:app --reload --port 8000
pause
