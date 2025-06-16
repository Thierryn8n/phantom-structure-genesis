@echo off
title Criar Pacote de Instalacao - Fiscal Flow Printer
echo =============================================
echo    CRIANDO PACOTE DE INSTALACAO
echo =============================================
echo.

:: Verifica se PowerShell está disponível
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] PowerShell nao encontrado.
    echo Este script requer PowerShell para funcionar.
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

:: Verifica se a pasta assets e o placeholder de ícone existem
if not exist "assets" (
    echo [ERRO] Pasta 'assets' nao encontrada.
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

:: Cria um ícone padrão se necessário
if not exist "assets\icon.ico" (
    echo [AVISO] Arquivo icon.ico nao encontrado.
    echo Deseja criar um icone padrao? (S/N)
    set /p createIcon=
    
    if /i "%createIcon%"=="S" (
        echo Criando icone padrao...
        powershell -Command "Add-Type -AssemblyName System.Drawing; $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('C:\Windows\System32\mspaint.exe'); $icon.ToBitmap().Save('assets\icon.png', [System.Drawing.Imaging.ImageFormat]::Png)"
        
        :: Converte PNG para ICO usando PowerShell
        echo Convertendo para formato ICO...
        powershell -Command "$sourcePath = 'assets\icon.png'; $targetPath = 'assets\icon.ico'; Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile((Get-Item $sourcePath).FullName); $ico = New-Object System.IO.MemoryStream; $img.Save($ico, [System.Drawing.Imaging.ImageFormat]::Icon); $ico.Position = 0; $writer = New-Object System.IO.FileStream((Get-Item $targetPath).FullName, [System.IO.FileMode]::Create); $ico.CopyTo($writer); $writer.Close(); $ico.Close(); $img.Dispose()"
        
        :: Remove o arquivo temporário PNG
        if exist "assets\icon.png" del "assets\icon.png"
    )
)

:: Verifica se tem o ícone após tentar criar
if not exist "assets\icon.ico" (
    echo [AVISO] Nenhum icone foi criado. O instalador funcionara, mas sem icone personalizado.
    echo.
    echo Pressione qualquer tecla para continuar...
    pause >nul
)

:: Prepara os arquivos essenciais para instalação
echo.
echo Verificando arquivos essenciais...
set missingFile=0

if not exist "main.js" set missingFile=1
if not exist "preload.js" set missingFile=1
if not exist "index.html" set missingFile=1
if not exist "package.json" set missingFile=1
if not exist "installer.bat" set missingFile=1
if not exist "Instalar Fiscal Flow Printer.vbs" set missingFile=1

if %missingFile%==1 (
    echo [ERRO] Alguns arquivos essenciais estao faltando.
    echo Certifique-se de que todos os arquivos do aplicativo estao presentes.
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo [OK] Todos os arquivos essenciais estao presentes.

:: Cria pasta de distribuição se não existir
if not exist "dist" mkdir "dist"

:: Nome do arquivo ZIP
set zipFile=dist\Fiscal_Flow_Printer_Installer.zip

:: Remove ZIP anterior se existir
if exist "%zipFile%" del "%zipFile%"

:: Cria arquivo ZIP com todos os arquivos necessários
echo.
echo Criando pacote de instalacao...
powershell -Command "Add-Type -Assembly 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::CreateFromDirectory('.', '%zipFile%', [System.IO.Compression.CompressionLevel]::Optimal, $false)"

:: Verifica se o ZIP foi criado com sucesso
if exist "%zipFile%" (
    echo.
    echo =============================================
    echo   PACOTE DE INSTALACAO CRIADO COM SUCESSO!
    echo =============================================
    echo.
    echo O pacote de instalacao foi criado em:
    echo %cd%\%zipFile%
    echo.
    echo Instrucoes para distribuicao:
    echo 1. Compartilhe este arquivo ZIP com seus clientes
    echo 2. Eles devem extrair o conteudo e dar duplo-clique em "Instalar Fiscal Flow Printer.vbs"
    echo 3. O resto da instalacao sera automatico
    echo.
) else (
    echo.
    echo [ERRO] Falha ao criar o pacote de instalacao.
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
exit /b 0 