@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo ========================================
echo C-NotifyPush (M4 Sample)
echo ========================================
echo.

echo [1/3] Backend pip install...
pushd "%ROOT%\backend" || exit /b 1
python -m pip install -r requirements.txt
popd
echo.

echo [2/3] Frontend npm install...
pushd "%ROOT%\frontend" || exit /b 1
call npm install
popd
echo.

echo [3/3] Starting backend + frontend in new windows...
echo Backend: http://127.0.0.1:5000/api/v1/notify/health
echo Frontend: http://localhost:3000
echo.

start "C-NotifyPush-Backend" cmd /k "cd /d ""%ROOT%\backend"" && python app.py"
timeout /t 2 /nobreak >nul
start "C-NotifyPush-Frontend" cmd /k "cd /d ""%ROOT%\frontend"" && npm start"

echo Done. Two new console windows should be open.
pause
