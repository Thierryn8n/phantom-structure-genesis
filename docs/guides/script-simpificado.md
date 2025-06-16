# Usando o Script SQL Simplificado

Devido a problemas de sintaxe com o script original `apply_migrations.sql`, criamos uma versão simplificada que pode ser executada sem erros. Este documento explica como usar o script simplificado.

## O Problema

O script original (`apply_migrations.sql`) estava enfrentando um erro de sintaxe relacionado aos blocos PL/pgSQL aninhados:

```
ERROR:  42601: syntax error at or near "BEGIN"
LINE 86:         BEGIN
                 ^
```

## A Solução

Criamos um script simplificado (`create_ecommerce_tables.sql`) que:

1. Remove todos os blocos DO complexos e aninhados
2. Mantém as mesmas tabelas, índices e configurações
3. Usa sintaxe SQL padrão para garantir compatibilidade

## Como Usar o Script Simplificado

### No SQL Editor do Supabase

1. Acesse o console do Supabase: [https://app.supabase.io](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para a seção **SQL Editor** no menu lateral
4. Clique em **+ New Query**
5. Copie e cole o conteúdo do arquivo `sql/create_ecommerce_tables.sql`
6. Clique em **Run** para executar o script

### Pelo Terminal (se tiver acesso ao banco de dados)

```bash
psql -h DATABASE_HOST -U DATABASE_USER -d DATABASE_NAME -f sql/create_ecommerce_tables.sql
```

## Verificação

Para verificar se a migração foi aplicada com sucesso:

1. No console do Supabase, vá para **Table Editor**
2. Você deverá ver as novas tabelas: `migration_versions`, `user_roles`, `ecommerce_settings`, etc.
3. Execute a seguinte consulta SQL para confirmar:

```sql
SELECT * FROM migration_versions WHERE name = '20230808_create_ecommerce_settings';
```

## O Que Este Script Faz

Este script cria:

1. Tabela `user_roles` para controle de permissões
2. Tabela `ecommerce_settings` para configurações da loja
3. Tabela `ecommerce_themes` com temas predefinidos
4. Tabela `ecommerce_product_card_styles` para estilos de cartões de produtos
5. Funções e triggers para gerenciamento automático de datas
6. Políticas de segurança (RLS) para controle de acesso

## Próximos Passos

Após aplicar este script com sucesso:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Descomentar o código no arquivo `src/pages/ecommerce/Settings.tsx` que interage com as tabelas
3. Testar a aplicação acessando: `http://localhost:8083` 