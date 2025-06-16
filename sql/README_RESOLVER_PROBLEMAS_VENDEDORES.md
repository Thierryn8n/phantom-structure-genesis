# Guia para Resolução dos Problemas na Página de Vendedores

Este documento fornece instruções para resolver os problemas na página de vendedores, incluindo permissões do banco de dados e problemas de tipagem.

## 1. Executar o Script SQL para Configurar o Schema

Foi criado um script SQL completo para configurar corretamente a tabela de vendedores e todas as permissões necessárias.

### Como Aplicar o Script SQL:

1. Acesse o Supabase Studio da sua instância (https://app.supabase.com)
2. Navegue até a seção "SQL Editor"
3. Crie um novo script
4. Copie e cole o conteúdo do arquivo `sql/create_sellers_schema.sql`
5. Execute o script

Isto irá:
- Criar a tabela `sellers` se não existir
- Adicionar funções RPC (deactivate_seller, update_seller_image)
- Configurar políticas de Row Level Security (RLS)
- Criar o bucket de storage para imagens de vendedores
- Configurar todas as permissões necessárias

## 2. Resolver Problemas de Tipagem no Código

Existe um problema de tipagem no componente SellersManagement.tsx onde o TypeScript não reconhece a propriedade 'email' nos objetos de usuário. Siga estas etapas:

1. Localize o código que verifica se o usuário já existe:
```typescript
// Verificar se o usuário já existe no Supabase Auth
const existingAuthUser = authUsers.users.find(u => u.email === email);
```

2. Substitua pelo seguinte código (adicionando uma declaração de tipo):
```typescript
// Verificar se o usuário já existe no Supabase Auth
// @ts-ignore - Ignorando a verificação de tipos aqui, sabemos que os usuários têm email
const existingAuthUser = authUsers.users.find(u => u.email === email);
```

Ou utilize a abordagem com type assertion:
```typescript
type AuthUser = { id: string; email?: string; user_metadata?: any };
const existingAuthUser = (authUsers.users as AuthUser[]).find(u => u.email === email);
```

## 3. Limpar o Armazenamento Local para Evitar Problemas de Autenticação

Para evitar problemas persistentes com a autenticação:

1. Abra as ferramentas de desenvolvedor (F12)
2. Navegue até "Application" > "Storage" > "Local Storage"
3. Encontre e exclua os itens relacionados ao Supabase (key=supabase.auth.token)
4. Faça logout e login novamente

## 4. Verificar as Variáveis de Ambiente

Certifique-se de que as variáveis de ambiente estão corretamente configuradas no arquivo `.env`:

```
VITE_SUPABASE_URL=https://bbqtnkqjvhzhxdmjmqtt.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_SUPABASE_SERVICE_KEY=sua-chave-service-aqui
```

## 5. Reiniciar a Aplicação

Após realizar todas essas alterações, reinicie sua aplicação:

```
npm run dev
```

Ou com Bun:

```
bun run dev
```

## Verificação Final

Para verificar se tudo está funcionando corretamente:

1. Navegue até a página de vendedores
2. Tente adicionar um novo vendedor 
3. Verifique se os vendedores existentes são exibidos corretamente

Se ainda persistirem problemas, verifique os logs do navegador (F12 > Console) para mensagens de erro específicas. 