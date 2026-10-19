@echo off
title Salvar Alteracoes no Pendrive
color 0A
echo ========================================================
echo   SINCRONIZANDO: Disco C:  ---^>  Pendrive (D:)
echo ========================================================
echo.
echo Copiando todos os arquivos modificados...
echo (Excluindo node_modules e .next para maior velocidade)
echo.

if not exist "D:\contole de estoque" (
    color 0C
    echo [ERRO] O pendrive nao foi detectado na unidade D:\
    echo Conecte o pendrive e tente novamente.
    echo.
    pause
    exit /b 1
)

robocopy "C:\contole de estoque" "D:\contole de estoque" /MIR /XD node_modules .next .git /R:1 /W:1 /NFL /NDL

echo.
echo ========================================================
echo   [SUCESSO] Todos os arquivos estao 100%% atualizados
echo             no pendrive D:\contole de estoque!
echo ========================================================
echo.
pause
