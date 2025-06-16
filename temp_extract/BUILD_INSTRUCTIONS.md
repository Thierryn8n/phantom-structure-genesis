# Instruções para Build e Distribuição

Este documento explica como criar o instalador do Fiscal Flow Printer e distribuí-lo aos usuários.

## Requisitos para Build

- Node.js 14+ instalado
- Git (opcional, para controle de versão)
- Windows 10+ (para criar o instalador do Windows)

## Preparando o Ambiente

1. Clone ou faça o download deste repositório
2. Abra um terminal na pasta raiz do projeto
3. Instale as dependências:

```
npm install
```

## Adicionando um Ícone

1. Crie ou obtenha um arquivo de ícone (.ico)
2. Salve o arquivo como `assets/icon.ico`

> **Importante**: O ícone será usado no instalador, no aplicativo e na bandeja do sistema. Um ícone de alta qualidade é recomendado.

## Testando o Aplicativo Localmente

Para testar o aplicativo antes de criar o instalador:

```
npm start
```

Isso iniciará o aplicativo no modo de desenvolvimento. Verifique se tudo está funcionando corretamente.

## Criando o Instalador

### Método 1: Usando o Script de Setup

Execute o script de setup incluído:

```
node setup.js
```

Isso verificará os requisitos, instalará as dependências e executará o electron-builder para criar o instalador.

### Método 2: Build Manual

1. Certifique-se de que todas as dependências estão instaladas:

```
npm install
```

2. Execute o comando de build:

```
npm run build
```

O instalador será criado na pasta `dist`.

## Arquivos Gerados

Após o build, você encontrará os seguintes arquivos na pasta `dist`:

- `Fiscal Flow Printer Setup {versão}.exe` - Instalador para Windows
- `latest.yml` - Arquivo para atualizações automáticas (se configurado)

## Distribuição

### Opção 1: Distribuição Direta

Compartilhe o arquivo `.exe` diretamente com os usuários.

### Opção 2: Hospedagem Web

1. Faça upload do instalador para um serviço de hospedagem (Google Drive, Dropbox, etc.)
2. Compartilhe o link com os usuários

### Opção 3: GitHub Releases (recomendado para projetos de código aberto)

1. Crie uma conta no GitHub se não tiver uma
2. Crie um repositório para o projeto
3. Faça upload dos arquivos de build como um novo "Release"
4. Compartilhe o link da página de Releases

## Notas Adicionais

- **Certificado Digital**: Para distribuição comercial, considere assinar o instalador com um certificado digital para evitar avisos de segurança.
- **Atualizações**: O electron-builder pode ser configurado para suportar atualizações automáticas.
- **Tamanho do Instalador**: O instalador terá aproximadamente 70-100MB devido à inclusão do runtime do Electron. 