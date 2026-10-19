@echo off
title Atelie Textil - Servidor de Desenvolvimento com Sincronizacao
color 0B
echo ========================================================
echo   Plataforma de E-commerce Textil Sob Medida
echo   Modo Turbo: Executando no Disco C: com Backup no Pendrive
echo ========================================================
echo.

:: 1. Verifica se a pasta no C: ja existe, senao prepara
if not exist "C:\contole de estoque" (
    echo [1/4] Primeira vez detectada: Copiando projeto para C:\contole de estoque...
    robocopy "%~dp0." "C:\contole de estoque" /E /XD node_modules .next .git /NFL /NDL /R:1 /W:1
    cd /d "C:\contole de estoque"
    echo [2/4] Instalando modulos necessarios...
    call npm install
) else (
    echo [1/3] Sincronizando eventuais novidades do Pendrive para o C:...
    robocopy "%~dp0." "C:\contole de estoque" /XO /XN /XD node_modules .next .git /NFL /NDL /R:1 /W:1 >nul 2>&1
)

cd /d "C:\contole de estoque"

:: 2. Inicia monitor em segundo plano para espelhar alteracoes no pendrive em tempo real
echo [2/3] Ativando sincronizador em tempo real para o pendrive (D:)...
start "" /B powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\contole de estoque\sync_watcher.ps1"

:: 3. Abre o navegador apos 3 segundos
start "" /B cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

echo [3/3] Iniciando Servidor Next.js com maxima velocidade...
echo.
echo ========================================================
echo   Acesse no navegador: http://localhost:3000
echo   Dica: Qualquer alteracao salva sera enviada ao pendrive!
echo   Para encerrar, pressione CTRL + C no terminal.
echo ========================================================
echo.

call npm run dev

:: 4. Ao finalizar o servidor, faz sincronizacao final para garantir
echo.
echo ========================================================
echo   Encerrando e salvando alteracoes pendentes no Pendrive...
echo ========================================================
if exist "D:\contole de estoque" (
    robocopy "C:\contole de estoque" "D:\contole de estoque" /MIR /XD node_modules .next .git /NFL /NDL /R:1 /W:1
    echo.
    echo   [OK] Todas as alteracoes estao salvas no seu pendrive D:\ !
    echo   Voce ja pode desconectar o pendrive com seguranca.
) else (
    echo   [AVISO] Pendrive D:\ nao encontrado para a sincronizacao final.
)
echo ========================================================
echo.
pause
