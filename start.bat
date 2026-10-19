@echo off
title Quiz Musical
where bun >nul 2>nul
if errorlevel 1 (
  echo No se encontro Bun.
  echo Instala Bun desde https://bun.sh y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
start "" http://localhost:3000
bun run server.js
pause
