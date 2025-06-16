# Guia para Configuração do Sistema de Emails e Recuperação de Senha

Este documento fornece instruções para configurar e testar o sistema de envio de emails e recuperação de senha no Fiscal Flow.

## Configuração de Emails no Supabase

Para garantir que os emails de recuperação de senha e convites de novos vendedores funcionem corretamente:

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. No menu lateral, navegue para **Authentication > Email Templates**
4. Personalize os seguintes templates:
   - **Confirmação de Email**: Usado para verificar novos emails
   - **Mudança de Email**: Enviado quando o email é alterado
   - **Recuperação de Senha**: Enviado quando um usuário solicita redefinição de senha
   - **Convite mágico**: Usado para convidar novos vendedores

## Configuração do Redirecionamento

Para garantir que os links nos emails direcionem os usuários para as páginas corretas:

1. No Dashboard do Supabase, vá para **Authentication > URL Configuration**
2. Configure o **Site URL** com a URL base do seu aplicativo (por exemplo, `https://seu-dominio.com.br`)
3. Em **Redirect URLs**, adicione as seguintes URLs:
   - `https://seu-dominio.com.br/recover-password`
   - `https://seu-dominio.com.br/login`
   - `https://seu-dominio.com.br/dashboard`

## Fluxo de Recuperação de Senha

O sistema possui dois componentes principais para a recuperação de senha:

1. **Página de Solicitação** (`/forgot-password`): 
   - Permite que o usuário informe seu email
   - Envia um link de recuperação para o email cadastrado
   - Mostra uma confirmação de envio

2. **Página de Redefinição** (`/recover-password`):
   - Acessada via link enviado por email
   - Permite que o usuário defina uma nova senha
   - Redireciona para o dashboard após a confirmação

## Testando o Sistema

Para testar o sistema de recuperação de senha:

1. Acesse a página de login (`/login`)
2. Clique em "Esqueceu a senha?"
3. Digite o email da conta que deseja recuperar
4. Verifique a caixa de entrada (e pasta de spam) para o email com o link de recuperação
5. Clique no link e defina uma nova senha
6. Verifique se consegue fazer login com a nova senha

## Verificação de Problemas

Se os emails não estiverem sendo enviados:

1. Verifique no console do navegador por erros durante o processo
2. Verifique no painel do Supabase em **Authentication > Users** se o usuário existe
3. Em **Logs** no Supabase, verifique se há erros relacionados ao envio de emails
4. Certifique-se de que o domínio de email não está na lista de bloqueio do Supabase

## Adição de Novos Vendedores

Quando um administrador adiciona um novo vendedor:

1. Um usuário é criado no Supabase Auth
2. É enviado automaticamente um email com link para definição de senha
3. O vendedor clica no link, que o direciona para `/recover-password`
4. Após definir a senha, o vendedor é direcionado ao dashboard

## Novas Funcionalidades para Vendedores

Foram adicionadas duas novas funcionalidades para gerenciar vendedores:

1. **Reenviar Recuperação**:
   - Botão disponível no card de cada vendedor
   - Envia um novo email com link para o vendedor definir/redefinir sua senha
   - Útil quando o vendedor perdeu o email original ou o link expirou

2. **Verificar Status**:
   - Botão para verificar o status do usuário no sistema de autenticação
   - Mostra informações sobre o email e confirmação
   - Se o email não estiver confirmado, oferece a opção de reenviar o link
   - Ajuda a diagnosticar problemas de acesso dos vendedores

### Como usar o Reenvio de Email

1. Na página de vendedores, localize o vendedor para o qual deseja reenviar o email
2. Clique no botão "Reenviar Recuperação" no card do vendedor
3. O sistema enviará um novo email de recuperação para o endereço cadastrado
4. Uma notificação confirmará o envio do email

### Como verificar o Status do Vendedor

1. Na página de vendedores, localize o vendedor que deseja verificar
2. Clique no botão "Verificar Status" no card do vendedor
3. O sistema verificará o status do usuário e mostrará uma notificação com as informações
4. Se o email não estiver confirmado, será oferecida a opção de reenviar o link

### Solução de Problemas com Vendedores

Se o vendedor reportar problemas para acessar o sistema:

1. Use o botão "Verificar Status" para diagnosticar se o email está confirmado
2. Se necessário, use o botão "Reenviar Recuperação" para enviar um novo link
3. Oriente o vendedor a verificar a pasta de spam
4. Confirme se o email cadastrado está correto

## Solução de Problemas Comuns

### Email não recebido
- Verifique a pasta de spam
- Verifique se o email está cadastrado corretamente
- Verifique os logs do Supabase

### Link de redefinição inválido
- Os links de redefinição expiram após 24 horas
- Tente solicitar um novo link de redefinição
- Verifique se o URL está completo e não foi quebrado no email

### Erro ao definir nova senha
- A senha deve ter no mínimo 8 caracteres
- As senhas digitadas nos dois campos devem ser idênticas
- Verifique no console se há erros específicos

## Atualizações Futuras

Planejamos implementar as seguintes melhorias:

- Personalização adicional nos templates de email
- Opção para fazer login com código mágico (sem senha)
- Verificação em duas etapas para maior segurança
- Alertas de login em novos dispositivos

---

Para suporte adicional, entre em contato com a equipe técnica do Fiscal Flow. 