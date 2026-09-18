@echo off
echo =======================================================
echo   Starting Vehicle Service Management System
echo =======================================================
echo.
echo 1. Starting Backend on http://localhost:5000 ...
start "VSMS Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo 2. Starting Frontend on http://localhost:5173 ...
start "VSMS Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo =======================================================
echo   Both services started!
echo   Frontend URL: http://localhost:5173
echo   Backend API:  http://localhost:5000
echo =======================================================
pause
