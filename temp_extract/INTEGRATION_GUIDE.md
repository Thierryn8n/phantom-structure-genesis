# Guia de Integração - Fiscal Flow Printer

Este guia explica como integrar o aplicativo principal Fiscal Flow Notes com o aplicativo de impressão Fiscal Flow Printer.

## Visão Geral

O sistema funciona da seguinte forma:

1. O aplicativo principal (Fiscal Flow Notes) envia solicitações de impressão para o Supabase
2. O aplicativo de impressão (Fiscal Flow Printer) monitora o Supabase por novas solicitações
3. Quando uma nova solicitação é detectada, o documento é impresso automaticamente

## Configuração do Banco de Dados

### Tabela `print_jobs`

Certifique-se de que a seguinte tabela existe no seu projeto Supabase:

```sql
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  document_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

### Permissões no Supabase

Configure as seguintes permissões na tabela `print_jobs`:

- SELECT: Permitir para usuários autenticados e anônimos
- INSERT: Permitir para usuários autenticados
- UPDATE: Permitir para usuários anônimos (para atualização de status)

## Integração no Frontend (Fiscal Flow Notes)

### 1. Adicione uma função para enviar trabalhos de impressão

```javascript
// Exemplo em React usando Supabase
const sendPrintJob = async (documentData) => {
  const { data, error } = await supabase
    .from('print_jobs')
    .insert([
      {
        user_id: currentUser.id, // ID do usuário atual
        document_data: documentData
      }
    ]);
    
  if (error) {
    console.error('Erro ao enviar para impressão:', error);
    return false;
  }
  
  return true;
};
```

### 2. Estrutura de dados do documento

O objeto `documentData` deve seguir esta estrutura:

```javascript
const documentData = {
  header: "RECIBO DE VENDA #12345", // Opcional
  customer: {
    name: "Nome do Cliente",
    document: "123.456.789-00" // Opcional
  },
  items: [
    {
      name: "Produto 1",
      quantity: 2,
      price: 10.50
    },
    {
      name: "Produto 2",
      quantity: 1,
      price: 15.00
    }
  ],
  total: 36.00,
  payment: {
    method: "Cartão de Crédito"
  },
  footer: "Obrigado pela preferência!" // Opcional
};
```

### 3. Adicione um botão para impressão no componente FiscalNoteForm

```jsx
<Button 
  onClick={() => {
    // Prepara os dados do documento
    const documentData = {
      header: `NOTA FISCAL SIMPLIFICADA #${noteNumber}`,
      customer: {
        name: customerName,
        document: customerDocument
      },
      items: products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        price: product.price
      })),
      total: totalAmount,
      payment: {
        method: paymentMethod
      },
      footer: "Agradecemos sua preferência!"
    };
    
    // Envia para impressão
    sendPrintJob(documentData);
    
    // Mostra feedback ao usuário
    toast.success("Nota enviada para impressão!");
  }}
>
  Imprimir Nota
</Button>
```

### 4. Adicione a página de configuração de impressão

Crie uma página nas configurações que explique ao usuário como instalar e configurar o aplicativo de impressão:

```jsx
function PrinterSettings() {
  return (
    <div>
      <h1>Configuração de Impressora</h1>
      
      <p>
        Para imprimir automaticamente as notas fiscais, você precisa instalar
        o aplicativo Fiscal Flow Printer no computador conectado à impressora.
      </p>
      
      <h2>Instruções:</h2>
      <ol>
        <li>Faça o download do instalador do Fiscal Flow Printer</li>
        <li>Execute o instalador e siga as instruções na tela</li>
        <li>
          No aplicativo Fiscal Flow Printer, configure seu ID de usuário: 
          <strong>{currentUser.id}</strong>
        </li>
        <li>Configure o nome da sua impressora</li>
        <li>Clique em "Testar Conexão" e "Testar Impressora"</li>
      </ol>
      
      <Button>
        <DownloadIcon /> Download do Fiscal Flow Printer
      </Button>
    </div>
  );
}
```

## Monitoramento e Solução de Problemas

Para monitorar o status das impressões, você pode adicionar uma interface administrativa para visualizar a tabela `print_jobs`.

Consulte regularmente o Supabase para ver se há trabalhos com status `failed` e forneça opções para reenviar esses trabalhos ou notificar os usuários sobre problemas de impressão.

## Considerações de Segurança

- Nunca armazene informações sensíveis nos dados do documento
- Considere implementar expiração para trabalhos de impressão antigos
- Limite o número de trabalhos de impressão por usuário para evitar abusos 