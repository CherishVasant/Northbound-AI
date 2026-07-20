@echo off
title Northbound AI - Placement OS

echo ==================================================
echo   Northbound AI - Placement OS - Dev Server
echo ==================================================
echo.

:: There is no separate backend any more. The API routes live in app\api\**
:: and run inside Next.js itself, so one server is all that is needed.
::
:: Commands go through "corepack pnpm" rather than "pnpm": pnpm is not on PATH
:: on this machine, and corepack reads the packageManager field in package.json
:: so the pinned pnpm version is used - the same one Vercel builds with. Running
:: a newer pnpm rewrites pnpm-lock.yaml in a way that fails the Vercel build.

:: Free port 3000 if a previous run is still holding it
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call corepack pnpm install
    if errorlevel 1 (
        echo.
        echo   Dependency install failed. Fix the error above and re-run.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [1/2] Dependencies already installed. Skipping.
    echo.
)

echo [2/2] Starting Next.js dev server...
echo.
echo   App: http://localhost:3000
echo.
echo   Press Ctrl+C here to stop the server when you are done.
echo.

start http://localhost:3000
call corepack pnpm dev --port 3000
