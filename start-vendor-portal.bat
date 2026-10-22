@echo off
rem Starts the GeM Vendor Portal on http://127.0.0.1:8001
cd /d "%~dp0"
if exist "backend\.venv\Scripts\activate.bat" (
  call "backend\.venv\Scripts\activate.bat"
) else (
  py -3 -m venv .venv 2>nul || python -m venv .venv
  call .venv\Scripts\activate.bat
  python -m pip install --quiet -r vendor_portal\requirements.txt
)
python vendor_portal\run.py
pause
