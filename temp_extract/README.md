# Fiscal Flow Printer

Aplicação para monitoramento e impressão automática de documentos do Fiscal Flow.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- Windows 10 ou superior
- Impressora térmica compatível (HP DESKJET 2700 SERIES recomendada)

## Instalação

### Instalação Automática (Recomendado)

1. Faça o download do pacote de instalação do [último release](https://github.com/fiscal-flow/fiscal-flow-printer/releases/latest).
2. Execute o instalador e siga as instruções na tela.
3. Após a instalação, o aplicativo iniciará automaticamente.

### Instalação Manual

1. Clone ou faça o download deste repositório.
2. Abra o prompt de comando na pasta do projeto.
3. Execute o script de instalação:

```
node install.js
```

4. Para iniciar o aplicativo:

```
npm start
```

## Configuração

1. Ao iniciar o aplicativo pela primeira vez, você precisará inserir:
   - Seu ID de usuário do Fiscal Flow
   - Nome da impressora (padrão: "HP DESKJET 2700 SERIES")
   - Opções adicionais como intervalo de verificação

2. Clique no botão "Testar Conexão" para verificar se o aplicativo pode se conectar ao servidor.

3. Clique no botão "Testar Impressora" para enviar uma página de teste para a impressora configurada.

## Uso

Após a configuração inicial, o aplicativo continuará rodando em segundo plano (na bandeja do sistema) e verificará automaticamente por novos documentos para impressão.

- Para abrir a interface do aplicativo, clique no ícone na bandeja do sistema.
- O status de conexão é exibido na parte superior da interface.
- Para sair completamente do aplicativo, clique com o botão direito no ícone da bandeja do sistema e selecione "Sair".

## Solução de Problemas

- **O aplicativo não conecta ao servidor:**
  Verifique sua conexão com a internet e se o ID de usuário está correto.

- **Problemas com a impressão:**
  Verifique se a impressora está ligada, conectada e com papel. Certifique-se também de que o nome da impressora está configurado corretamente no aplicativo.

- **Erro de "Impressora não encontrada":**
  Verifique o nome exato da impressora no Painel de Controle do Windows > Dispositivos e Impressoras.

## Suporte

Para obter suporte, entre em contato pelo e-mail: suporte@fiscalflow.com 