@echo off
title Northbound Placement OS

echo ==================================================
echo   Northbound Placement OS - Dev Server
echo ==================================================
echo.

:: There is no separate backend any more. The API routes live in app\api\**
:: and run inside Next.js itself, so one server is all that is needed.

:: Free port 3000 if a previous run is still holding it
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call pnpm install
    echo.
) else (
    echo [1/2] Dependencies already installed. Skipping.
    echo.
)

echo [2/2] Starting Next.js dev server...
echo.
echo   App: http://localhost:3000
echo.
echo   Press Ctrl+C in this window to stop the server when you are done.
echo.

start http://localhost:3000
call pnpm dev
