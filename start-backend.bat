@echo off
rem Starts the FastAPI backend on http://127.0.0.1:8000  (API docs: http://127.0.0.1:8000/docs)
rem Optional e-mail settings live in secrets.bat (copy secrets.bat.example to secrets.bat and edit it).
cd /d "%~dp0backend"
if exist "%~dp0secrets.bat" call "%~dp0secrets.bat"
if not exist .venv (
  echo Creating Python virtual environment...
  py -3 -m venv .venv 2>nul || python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --quiet -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
pause
