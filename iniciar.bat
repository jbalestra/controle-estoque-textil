@echo off
title Bags House - Servidor de Desenvolvimento
color 0B
echo ========================================================
echo   Bags House - Necessaires Personalizadas ^& E-commerce
echo   Iniciando servidor local Next.js...
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [1/2] Instalando dependencias do projeto...
    call npm install
)

:: Abre o navegador apos 3 segundos
start "" /B cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

echo ========================================================
echo   Acesse no navegador: http://localhost:3000
echo   Painel do Lojista:   http://localhost:3000/lojista
echo   Para encerrar, pressione CTRL + C no terminal.
echo ========================================================
echo.

call npm run dev
pause
