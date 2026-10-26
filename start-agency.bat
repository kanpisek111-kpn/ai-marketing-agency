@echo off
chcp 65001 >nul
title AI Marketing Agency (7 Autonomous Agents)
cd /d "%~dp0"

echo ============================================================
echo 🚀 กำลังเปิดระบบ AI Marketing Agency + Mobile Cloudflare Tunnel...
echo 👉 แดชบอร์ดในเครื่อง: http://localhost:3080
echo ============================================================

start /b node "%~dp0src\tunnelRunner.js"
start http://localhost:3080
node "%~dp0server.js"
pause
