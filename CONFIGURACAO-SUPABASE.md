# Configuração do Supabase para o Fiscal Flow Notes

## Configuração de Segurança para Páginas Públicas de E-commerce

Por padrão, o Supabase exige autenticação para acessar os dados das tabelas. No entanto, para as páginas públicas do e-commerce (como a página principal da loja, carrinho de compras e checkout), precisamos permitir acesso anônimo (sem autenticação).

### Problema: Erro 401 (Unauthorized) nas páginas de e-commerce

Se você estiver enfrentando erros 401 (Unauthorized) ao acessar a página do e-commerce, é porque o Supabase está bloqueando o acesso aos dados para usuários não autenticados.

### Solução: Configurar Políticas de Segurança (RLS - Row Level Security)

Para resolver esse problema, você precisa configurar políticas de segurança no Supabase para permitir acesso de leitura anônimo às tabelas de e-commerce.

Siga estas etapas:

1. Acesse o painel do Supabase em: https://app.supabase.com
2. Selecione seu projeto
3. Navegue até: **Database > Tables**
4. Para cada uma das tabelas a seguir, configure uma política de leitura pública:

#### Para a tabela `products`:

1. Selecione a tabela `products`
2. Vá para a aba **Policies**
3. Clique em **Add Policy**
4. Selecione **Create custom policy**
5. Configure:
   - Policy name: `Enable public read access`
   - Target roles: `anon, authenticated`
   - Using expression: `true`
   - Definition: `SELECT`
6. Clique em **Save policy**

#### Para a tabela `ecommerce_categories`:

1. Selecione a tabela `ecommerce_categories`
2. Vá para a aba **Policies**
3. Clique em **Add Policy**
4. Selecione **Create custom policy**
5. Configure:
   - Policy name: `Enable public read access`
   - Target roles: `anon, authenticated`
   - Using expression: `true`
   - Definition: `SELECT`
6. Clique em **Save policy**

#### Para a tabela `ecommerce_settings`:

1. Selecione a tabela `ecommerce_settings`
2. Vá para a aba **Policies**
3. Clique em **Add Policy**
4. Selecione **Create custom policy**
5. Configure:
   - Policy name: `Enable public read access`
   - Target roles: `anon, authenticated`
   - Using expression: `true`
   - Definition: `SELECT`
6. Clique em **Save policy**

### Após a configuração

Depois de aplicar essas configurações, a página do e-commerce deve carregar os produtos, categorias e configurações da loja corretamente, mesmo para usuários não autenticados.

## Observações

- As políticas acima permitem apenas **leitura** de dados. Operações de escrita (INSERT, UPDATE, DELETE) ainda exigirão autenticação.
- Para o carrinho de compras, como o mesmo é armazenado localmente no navegador do usuário (localStorage), não é necessário autenticação para operações básicas de carrinho.
- Para finalizar a compra (checkout), o usuário deverá estar autenticado. 