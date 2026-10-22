@echo off
rem Opens the officer backend, officer frontend, and the vendor portal, each in its own window
start "GeM BidVerify - Officer Backend (Port 8000)" cmd /k "%~dp0start-backend.bat"
start "GeM BidVerify - Officer Frontend (Port 5173)" cmd /k "%~dp0start-frontend.bat"
start "GeM BidVerify - Vendor Portal (Port 8001)" cmd /k "%~dp0start-vendor-portal.bat"

