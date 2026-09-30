@echo off
echo ===================================================
echo   Starting EntityResolve AI - Full Platform Suite
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8001 ...
start "EntityResolve AI - Backend" cmd /k "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "EntityResolve AI - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Platform is running!
echo   Frontend: http://localhost:5173/
echo   Backend:  http://127.0.0.1:8001/
echo   Swagger:  http://127.0.0.1:8001/docs
echo ===================================================
pause
