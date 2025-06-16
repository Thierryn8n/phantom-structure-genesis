# Guia de Autenticação - Fiscal Flow

Este documento descreve como a autenticação funciona no Fiscal Flow e como resolver problemas comuns de autenticação.

## Melhorias Implementadas

Implementamos um sistema robusto de autenticação com as seguintes características:

1. **Sistema de recuperação automática de sessões**
   - Detecta quando a sessão está ausente ou corrompida
   - Tenta recuperar automaticamente a sessão em segundo plano
   - Mostra uma interface amigável para recuperação manual quando necessário

2. **Verificação constante de autenticação**
   - Verifica em todas as páginas protegidas
   - Redireciona para a página de login quando necessário
   - Mantém o caminho atual para redirecionar de volta após login

3. **Logs detalhados para diagnóstico**
   - Registra eventos de autenticação no console
   - Facilita a identificação da causa raiz de problemas
   - Útil para desenvolvimento e suporte

4. **Persistência aprimorada de sessão**
   - Configuração otimizada do cliente Supabase
   - Atualização automática de tokens expirados
   - Limpeza adequada em logout para evitar corrupção de dados

## Como a Autenticação Funciona Agora

1. **Fluxo de login**
   - Quando o usuário faz login, as credenciais são validadas pelo Supabase
   - A sessão é armazenada no localStorage
   - O contexto de autenticação é atualizado com o usuário atual
   - O usuário é redirecionado para a página solicitada

2. **Navegação em páginas protegidas**
   - Cada página protegida verifica automaticamente a autenticação
   - Se o usuário não estiver autenticado, o sistema tenta recuperar a sessão
   - Se não conseguir recuperar, mostra interface de recuperação ou redireciona para login

3. **Renovação de token**
   - O sistema detecta tokens prestes a expirar
   - Renova automaticamente antes da expiração
   - Garante experiência ininterrupta

## Resolução de Problemas Comuns

### Problema: "Usuário não autenticado" em todas as páginas

**Solução:**
1. Abra o Console do navegador (F12 > Console)
2. Verifique os logs com prefixo "AuthContext:" e "AuthChecker:"
3. Limpe o localStorage:
   ```javascript
   localStorage.removeItem('supabase.auth.token')
   ```
4. Faça logout e login novamente
5. Verifique se as variáveis de ambiente estão corretas no arquivo .env

### Problema: Sessão expira frequentemente

**Solução:**
1. Verifique a conexão com internet
2. Confirme que o cliente Supabase está configurado corretamente
3. Verifique se há bloqueadores de cookies ou localStorage
4. Teste em outro navegador para isolar problemas específicos

### Problema: Não é possível criar/gerenciar vendedores

**Solução:**
1. Execute o script SQL para configurar corretamente as permissões:
   ```sql
   -- Use o arquivo em sql/migrations/20200601000000_create_sellers_schema.sql
   ```
2. Verifique se o usuário tem as permissões corretas no Supabase
3. Confirme que a chave de serviço do Supabase está configurada corretamente

## Verificação de Autenticação

Para verificar se a autenticação está funcionando corretamente:

1. Abra o Console do navegador (F12 > Console)
2. Execute:
   ```javascript
   const check = async () => {
     const { data } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
     console.log('Sessão atual:', data.session);
     console.log('Autenticado:', !!data.session);
     if (data.session) {
       console.log('Expira em:', new Date(data.session.expires_at * 1000).toLocaleString());
     }
   }
   check();
   ```

## Componentes Envolvidos na Autenticação

- **AuthContext.tsx**: Gerencia o estado de autenticação global
- **AuthChecker.tsx**: Verifica autenticação em todas as páginas
- **ProtectedRoute.tsx**: Protege rotas que requerem autenticação
- **Login.tsx**: Página de login com suporte a redirecionamento
- **src/integrations/supabase/client.ts**: Cliente Supabase configurado
- **src/lib/supabaseClient.ts**: Cliente administrativo para operações privilegiadas

## Fluxo de Diagnóstico e Recuperação

Se você ainda enfrentar problemas de autenticação:

1. **Verifique os logs**:
   - Em cada página que apresentar problemas, verifique os logs no console
   - Procure especialmente por mensagens sobre JWT expirado ou erro de autenticação

2. **Tente a recuperação manual**:
   - Clique em "Recuperar Sessão" quando a interface de recuperação aparecer
   - Se não aparecer, tente acessar qualquer página protegida para ativar a verificação

3. **Último recurso - Limpar completamente**:
   - Execute no console:
   ```javascript
   // Limpar dados de autenticação
   localStorage.clear();
   sessionStorage.clear();
   // Recarregar a página
   window.location.href = '/login';
   ```

---

Para mais assistência, contate o suporte técnico. 