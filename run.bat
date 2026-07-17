@echo off
title PrepTrack Double Server Launcher

echo ==================================================
echo   PrepTrack Placement Preparation Tracker Launcher
echo ==================================================

echo Stopping any existing processes on ports 3000 and 5000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo.

:: Check and install backend dependencies if missing
if not exist "backend\node_modules\" (
    echo [1/4] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
) else (
    echo [1/4] Backend dependencies already installed. Skipping.
    echo.
)

:: Start Express Backend Server
echo [2/4] Launching Express Backend Server...
start "PrepTrack Backend" cmd /k "cd backend && npm run dev"

echo.
echo Waiting 10 seconds before starting the frontend...
timeout /t 10 /nobreak >nul

:: Start Next.js Frontend Server
echo [3/4] Launching Next.js Frontend Server...
start "PrepTrack Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to initialize
echo.
echo [4/4] Waiting 5 seconds for frontend to initialize...
timeout /t 5 /nobreak >nul

:: Completion report
echo.
echo --------------------------------------------------
echo   PrepTrack Servers are initialized!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000
echo --------------------------------------------------
echo.

echo Launching default browser...
start http://localhost:3000

echo.
echo Press any key to close this launcher.
echo (The backend and frontend terminals will continue running.)
pause >nul