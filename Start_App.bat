@echo off
title Muscle Recovery Tracker
color 0A
echo ===================================================
echo     KHOI DONG MUSCLE RECOVERY TRACKER...
echo ===================================================
echo.
echo Dang khoi tao may chu (Server) va mo trinh duyet...
echo Vui long KHONG tat cua so nay trong luc dang su dung ung dung.
echo.
cd /d "%~dp0"
npm run dev -- --open
