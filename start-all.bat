@echo off
rem Opens the backend and the frontend, each in its own window
start "GeM BidVerify - backend" cmd /k "%~dp0start-backend.bat"
start "GeM BidVerify - frontend" cmd /k "%~dp0start-frontend.bat"
