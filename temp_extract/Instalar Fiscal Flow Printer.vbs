Option Explicit

Dim shell, fso, currentDir, batFile, nodeInstallFile
Dim answer, command, result

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetAbsolutePathName(".")
batFile = currentDir & "\installer.bat"

' Verifica se o arquivo installer.bat existe
If Not fso.FileExists(batFile) Then
    MsgBox "Erro: O arquivo installer.bat não foi encontrado.", vbCritical, "Instalador Fiscal Flow Printer"
    WScript.Quit(1)
End If

' Verifica se o Node.js está instalado
On Error Resume Next
result = shell.Run("where node", 0, True)
On Error GoTo 0

If result <> 0 Then
    ' Node.js não encontrado, perguntar se deseja instalar
    answer = MsgBox("O Node.js é necessário para executar o Fiscal Flow Printer, mas não foi encontrado no seu sistema." & vbCrLf & vbCrLf & _
                   "Deseja fazer o download e instalar o Node.js agora?", vbYesNo + vbQuestion, "Instalador Fiscal Flow Printer")
    
    If answer = vbYes Then
        ' Baixar e executar o instalador do Node.js
        nodeInstallFile = currentDir & "\node_setup.msi"
        command = "bitsadmin /transfer NodeJS /download /priority high https://nodejs.org/dist/v16.16.0/node-v16.16.0-x64.msi " & nodeInstallFile
        shell.Run command, 0, True
        
        If fso.FileExists(nodeInstallFile) Then
            MsgBox "O Node.js será instalado agora. Por favor, siga as instruções na tela de instalação." & vbCrLf & vbCrLf & _
                   "Após a instalação do Node.js ser concluída, o instalador do Fiscal Flow Printer continuará automaticamente.", _
                   vbInformation, "Instalador Fiscal Flow Printer"
            
            shell.Run """" & nodeInstallFile & """", 1, True
            
            ' Verificar novamente se o Node.js foi instalado
            On Error Resume Next
            result = shell.Run("where node", 0, True)
            On Error GoTo 0
            
            If result <> 0 Then
                MsgBox "A instalação do Node.js parece não ter sido concluída corretamente." & vbCrLf & _
                       "Por favor, instale o Node.js manualmente e tente novamente.", vbCritical, "Instalador Fiscal Flow Printer"
                WScript.Quit(1)
            End If
        Else
            MsgBox "Não foi possível baixar o instalador do Node.js." & vbCrLf & _
                   "Por favor, instale o Node.js manualmente e tente novamente.", vbCritical, "Instalador Fiscal Flow Printer"
            WScript.Quit(1)
        End If
    Else
        MsgBox "A instalação foi cancelada. O Node.js é necessário para o funcionamento do aplicativo.", vbInformation, "Instalador Fiscal Flow Printer"
        WScript.Quit(0)
    End If
End If

' Mostra mensagem de instalação iniciada
MsgBox "A instalação do Fiscal Flow Printer será iniciada agora." & vbCrLf & vbCrLf & _
       "Este processo pode levar alguns minutos. Por favor, aguarde a conclusão.", vbInformation, "Instalador Fiscal Flow Printer"

' Executa o instalador batch
shell.Run """" & batFile & """", 1, True

' Limpeza de arquivos temporários
If fso.FileExists(nodeInstallFile) Then
    fso.DeleteFile nodeInstallFile, True
End If 