@echo off
setlocal
title 🍌 ACCESO GLOBAL - FINCA DE PLÁTANO

echo ══════════════════════════════════════════════════════════════
echo   🍌  INICIANDO SISTEMA CON ACCESO DESDE CUALQUIER LUGAR
echo ══════════════════════════════════════════════════════════════
echo.

:: 1. Configurar el Token (Usando el que me diste anteriormente)
echo [1/3] Configurando seguridad...
ngrok config add-authtoken 38HTYEb0pGsoMXqD8AcJRiJ1ATg_57oTdLED8erd7f65Dj653 >nul 2>&1

:: 2. Iniciar el servidor de la finca en una ventana aparte
echo [2/3] Iniciando servidor de la finca...
start "SERVIDOR FINCA" cmd /k "node server.js"

:: 3. Iniciar Ngrok para darte el link
echo [3/3] Generando enlace para tu celular...
echo.
echo 💡 INSTRUCCIONES:
echo 1. Busca la linea que dice "Forwarding"
echo 2. Copia el link que empieza con https://
echo 3. Abrelo en cualquier celular o tablet.
echo.
echo --------------------------------------------------------------
ngrok http 3000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se encontro el archivo 'ngrok.exe'.
    echo Por favor, descarga ngrok y ponlo en esta misma carpeta.
    pause
)
