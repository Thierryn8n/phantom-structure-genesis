@echo off
title Instalador Fiscal Flow Printer
echo ======================================
echo    INSTALADOR FISCAL FLOW PRINTER
echo ======================================
echo.
echo Iniciando instalacao... Por favor, aguarde.
echo.

:: Verifica se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado.
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/dist/v16.16.0/node-v16.16.0-x64.msi
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo [OK] Node.js encontrado.
echo.

:: Criar pasta de destino
set INSTALL_DIR=%LOCALAPPDATA%\FiscalFlowPrinter
echo Criando pasta de instalacao em %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Copiar todos os arquivos para a pasta de destino
echo Copiando arquivos...
xcopy /E /I /Y "." "%INSTALL_DIR%\"

:: Ir para a pasta de instalação
cd /d "%INSTALL_DIR%"

:: Instalar dependências
echo.
echo Instalando dependencias (isso pode demorar alguns minutos)...
call npm install --production --no-audit --no-fund --silent

:: Criar atalho na área de trabalho
echo.
echo Criando atalho na area de trabalho...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Fiscal Flow Printer.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; $Shortcut.IconLocation = '%INSTALL_DIR%\assets\icon.ico'; $Shortcut.Save()"

:: Criar atalho no menu iniciar
echo.
echo Criando atalho no menu iniciar...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Fiscal Flow" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Fiscal Flow"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Fiscal Flow\Fiscal Flow Printer.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; $Shortcut.IconLocation = '%INSTALL_DIR%\assets\icon.ico'; $Shortcut.Save()"

:: Configurar inicialização automática (opcional)
echo.
echo Configurando inicializacao automatica...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Fiscal Flow Printer.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start.bat'; $Shortcut.IconLocation = '%INSTALL_DIR%\assets\icon.ico'; $Shortcut.Save()"

:: Criar batch de inicialização
echo.
echo Criando arquivo de inicializacao...

(
echo @echo off
echo start "" "%INSTALL_DIR%\node_modules\.bin\electron.cmd" "%INSTALL_DIR%"
) > "%INSTALL_DIR%\start.bat"

echo.
echo =============================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo =============================================
echo.
echo O Fiscal Flow Printer foi instalado em:
echo %INSTALL_DIR%
echo.
echo Voce pode iniciar o aplicativo de tres formas:
echo 1. Clicando no atalho da area de trabalho
echo 2. Pelo Menu Iniciar em: Fiscal Flow ^> Fiscal Flow Printer
echo 3. O aplicativo inicializara automaticamente quando ligar o computador
echo.
echo Pressione qualquer tecla para iniciar o aplicativo...
pause >nul

:: Iniciar o aplicativo
start "" "%INSTALL_DIR%\start.bat"
exit /b 0 