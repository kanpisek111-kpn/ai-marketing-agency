@echo off
chcp 65001 >nul
echo ============================================================
echo 🚀 กำลังเปิดระบบ AI Marketing Agency Command Dashboard...
echo 👉 เปิดเบราว์เซอร์ไปที่: http://localhost:3080
echo ============================================================
start http://localhost:3080
node "%~dp0server.js"
pause
