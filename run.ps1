# PowerShell Setup & Execution Script for ShopVibe FAQ Chatbot (Flat Layout)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       ShopVibe AI Support Center Setup           " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verify Python Installation
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not found in your environment PATH. Please download and install Python (3.8+) before proceeding."
    exit 1
}

# 2. Setup Virtual Environment
if (!(Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment (.venv)..." -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create virtual environment."
        exit 1
    }
}

# 3. Upgrade Pip & Install Requirements
Write-Host "Upgrading pip & installing dependencies..." -ForegroundColor Yellow
& ".\.venv\Scripts\python" -m pip install --upgrade pip
& ".\.venv\Scripts\pip" install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies from requirements.txt."
    exit 1
}

# 4. Run Server & Launch Browser
Write-Host "Starting local FastAPI support server..." -ForegroundColor Green
Write-Host "Access Chatbot Interface at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Access OpenAPI Documentation at: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in this terminal window to stop the server." -ForegroundColor Yellow

# Launch default browser in the background after a 1.5s delay
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:8000"
} | Out-Null

# Start Uvicorn reload server from the root directory
& ".\.venv\Scripts\python" -m uvicorn main:app --reload --port 8000
