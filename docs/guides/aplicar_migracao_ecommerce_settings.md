# Guia para Aplicar Migrações no Supabase

Este guia explica como aplicar as migrações SQL para as tabelas de configurações do e-commerce no banco de dados Supabase.

## O que estas migrações fazem

As migrações criam as seguintes tabelas no banco de dados:

1. `user_roles` - Armazena papéis de usuários (admin, cliente, etc.)
2. `ecommerce_settings` - Configurações gerais da loja
3. `ecommerce_themes` - Temas predefinidos para a loja
4. `ecommerce_product_card_styles` - Estilos dos cartões de produtos

Também configura políticas de segurança (Row Level Security) para controlar quem pode visualizar e editar as configurações.

## Pré-requisitos

- Acesso ao console do Supabase
- Direitos de administrador para executar SQL no banco de dados

## Passos para aplicar a migração

### Método 1: Usando o SQL Editor do Supabase

1. Faça login no [console do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para a seção **SQL Editor** no menu lateral
4. Clique em **+ New Query**
5. Copie e cole o conteúdo do arquivo `sql/apply_migrations.sql`
6. Clique em **Run** para executar o script

### Método 2: Usando a CLI do Supabase

Se você estiver usando a CLI do Supabase para desenvolvimento local:

1. Abra um terminal
2. Navegue até a pasta raiz do projeto
3. Execute o seguinte comando:

```bash
supabase db reset
```

Este comando irá aplicar todas as migrações no diretório `supabase/migrations`.

### Verificação

Para verificar se a migração foi aplicada com sucesso:

1. No console do Supabase, vá para **Table Editor**
2. Você deverá ver as novas tabelas na lista
3. Execute a seguinte consulta SQL para confirmar:

```sql
SELECT * FROM migration_versions WHERE name = '20230808_create_ecommerce_settings';
```

Se retornar um registro, a migração foi aplicada com sucesso.

## Solução de Problemas

### Erro: tabela "user_roles" não existe

Se você encontrar este erro, significa que a tabela `user_roles` não foi criada. O script `apply_migrations.sql` deve resolver isso automaticamente, mas se não funcionar, execute:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);
```

### Erro: there is no unique or exclusion constraint matching the ON CONFLICT specification

Se encontrar este erro, significa que uma restrição UNIQUE está ausente. O script corrigido já deve resolver isso, mas se persistir, verifique se a tabela `ecommerce_product_card_styles` tem uma restrição UNIQUE na coluna `settings_id`.

## Depois da Migração

Após aplicar a migração com sucesso, você pode:

1. Descomentar o código no arquivo `src/pages/ecommerce/Settings.tsx` que interage com estas tabelas
2. Atualizar o cliente Supabase (TypeScript) para incluir os novos tipos de tabela
3. Começar a usar as configurações do e-commerce em sua aplicação

## Próximos Passos

1. Criar um cliente TypeScript atualizado para interagir com estas tabelas
2. Implementar um tema dinâmico que leia as configurações do banco de dados
3. Atualizar o componente de visualização de produtos para usar os estilos de cartão configurados 