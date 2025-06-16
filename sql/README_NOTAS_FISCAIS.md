# Sistema de Gerenciamento de Notas Fiscais

Este documento contém instruções detalhadas sobre o sistema de Notas Fiscais do Fiscal Flow, suas funcionalidades e configurações de segurança.

## Visão Geral

O sistema de notas fiscais permite:

1. Criar e gerenciar notas fiscais/orçamentos
2. Rastrear notas criadas por diferentes vendedores
3. Filtrar e buscar notas por diversos critérios
4. Controlar o acesso baseado em papéis (proprietário vs. vendedor)

## Controle de Acesso

O sistema implementa um controle de acesso detalhado através de Row Level Security (RLS) do Supabase:

- **Proprietários da Conta (Owners)**: Têm acesso a todas as notas fiscais criadas por qualquer vendedor associado à sua conta. Podem criar, editar, visualizar e excluir notas (com limitações em alguns estados).

- **Vendedores**: Têm acesso apenas às notas que eles próprios criaram. Podem criar novas notas e gerenciar apenas suas próprias notas.

## Como Configurar o Banco de Dados

Para configurar o sistema de notas fiscais no Supabase:

1. Acesse o painel do Supabase em [https://app.supabase.com](https://app.supabase.com)
2. Navegue até o SQL Editor
3. Execute o script SQL localizado em `sql/migrations/20200602000000_create_fiscal_notes_table.sql`

Este script irá:
- Criar a tabela `fiscal_notes`
- Configurar índices para melhor desempenho
- Implementar políticas de RLS para controle de acesso
- Criar funções auxiliares como `mark_note_as_printed`

## Estados das Notas Fiscais

Cada nota fiscal pode estar em um dos seguintes estados:

- `draft`: Rascunho - pode ser editado ou excluído
- `issued`: Emitida - pronta para impressão
- `printed`: Impressa - já foi impressa pelo sistema
- `finalized`: Finalizada - nota concluída
- `canceled`: Cancelada - nota anulada

## Como Utilizar o Sistema

### Proprietários

Como proprietário da conta, você pode:

1. Ver todas as notas criadas na sua conta
2. Filtrar notas por vendedor, data, status, etc.
3. Gerenciar notas de qualquer vendedor
4. Gerar relatórios e estatísticas

Para acessar todas as notas:
- Acesse a página "Notas Fiscais" no menu principal
- Utilize os filtros para encontrar notas específicas
- O filtro de "Vendedor" permite visualizar notas de um vendedor específico

### Vendedores

Como vendedor, você pode:

1. Ver apenas suas próprias notas
2. Criar novas notas que serão automaticamente associadas ao seu usuário
3. Gerenciar suas notas (editar rascunhos, marcar como impressas, etc.)

Para visualizar suas notas:
- Acesse a página "Notas Fiscais" no menu principal
- As notas listadas serão apenas aquelas que você criou
- Você não terá acesso a notas de outros vendedores

## Troubleshooting

Se encontrar problemas com o sistema de notas fiscais:

### Problemas de Permissão

Se um vendedor não conseguir ver suas notas:
1. Verifique se o vendedor está corretamente cadastrado na tabela `sellers`
2. Confirme que o ID do vendedor está corretamente associado às notas criadas

### Notas Não Aparecem

Se notas recém-criadas não aparecerem:
1. Verifique se o status da nota está correto
2. Confirme que as políticas de RLS estão instaladas corretamente
3. Limpe o cache do navegador e faça login novamente

## Consultas SQL Úteis

Para verificar as políticas de RLS aplicadas à tabela:

```sql
SELECT * FROM pg_policies WHERE tablename = 'fiscal_notes';
```

Para visualizar todas as notas de um vendedor específico:

```sql
SELECT * FROM fiscal_notes WHERE seller_id = 'ID_DO_VENDEDOR';
```

## Suporte

Para mais informações ou suporte, entre em contato com a equipe do Fiscal Flow. 