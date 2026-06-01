@echo off
title Finca de Platano - Sistema
color 0A

echo.
echo  ============================================
echo    FINCA DE PLATANO - Iniciando sistema...
echo  ============================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo  Instalando dependencias por primera vez...
    echo  Esto puede tomar un par de minutos.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: No se pudo instalar las dependencias.
        echo  Asegurese de tener Node.js instalado.
        echo  Descargue desde: https://nodejs.org
        pause
        exit /b 1
    )
    echo.
    echo  Dependencias instaladas correctamente!
    echo.
)

echo  Iniciando servidor...
echo.
node server.js

pause
