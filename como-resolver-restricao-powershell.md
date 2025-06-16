# Resolvendo Restrições de Execução de Scripts no PowerShell

Você tem várias opções para resolver o erro "a execução de scripts foi desabilitada neste sistema":

## Opção 1: Abrir o PowerShell como Administrador e alterar a política de execução

1. Clique com o botão direito do mouse no ícone do PowerShell
2. Selecione "Executar como administrador"
3. Execute o seguinte comando:

```powershell
Set-ExecutionPolicy RemoteSigned
```

4. Digite "S" para confirmar a alteração

## Opção 2: Usar o Prompt de Comando (CMD) em vez do PowerShell

O Prompt de Comando não tem as mesmas restrições de segurança que o PowerShell:

1. Pressione Win + R
2. Digite `cmd` e pressione Enter
3. Navegue até a pasta do seu projeto:
```cmd
cd C:\Users\Thier\Downloads\Thier\fiscal-flow-notes
```
4. Execute o comando npm:
```cmd
npm install @react-google-maps/api --save
```

## Opção 3: Contornar a política apenas para um único comando

Se você não quiser alterar permanentemente a política de segurança, você pode executar um único comando assim:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm install @react-google-maps/api --save"
```

## Opção 4: Usar um gerenciador de pacotes alternativo

Se você tiver o Yarn instalado, pode usá-lo em vez do npm:

```
yarn add @react-google-maps/api
```

## Após a instalação

Depois de instalar o pacote, verifique se o arquivo `src/types.d.ts` foi criado corretamente com as definições de tipo. Se o arquivo não existir ou estiver vazio, copie manualmente o conteúdo fornecido nas instruções anteriores. 