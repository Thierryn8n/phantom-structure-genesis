# Configuração do Supabase Storage

Este guia explica como configurar o Storage no Supabase para permitir upload de imagens no Fiscal Flow.

## 1. Problema com "jwt expired" ou "Bucket not found"

Estes erros ocorrem quando:
- O token JWT de autenticação expirou
- Você não está autenticado no Supabase
- A chave de serviço (service key) não está configurada

## 2. Configurar a Chave de Serviço

### 2.1. Obter a chave de serviço
1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para `Settings > API`
4. Na seção **Project API Keys**, copie a chave `service_role key`

> ⚠️ ATENÇÃO: Esta é uma chave com privilégios administrativos. Nunca compartilhe ou exponha esta chave publicamente.

### 2.2. Configurar no arquivo .env

Adicione a variável no arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_SERVICE_KEY=sua-chave-service-role-aqui
```

## 3. Configurar os Buckets Manualmente (Alternativa)

Se o método automático não funcionar, você pode criar os buckets manualmente:

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para `Storage` na barra lateral
4. Clique em `New Bucket`
5. Crie três buckets com os seguintes nomes:
   - `store-logos` - para logotipos da loja
   - `store-favicons` - para favicons
   - `store-banners` - para banners

Para cada bucket:
1. Clique no bucket
2. Vá para `Policies`
3. Clique em `Add Policies`
4. Selecione `GET` (leitura) e marque como `Public`
5. Clique em "Allow access to all users" (permitir acesso a todos os usuários)

## 4. Verificar Que o Upload Funciona

Após configurar a chave de serviço e reiniciar o aplicativo, acesse a página de configurações da loja e tente fazer upload de:
- Logotipo
- Favicon
- Banner principal (dimensões recomendadas: 1920 x 580 pixels)

### 4.1 Recomendações para o banner principal

Para a melhor experiência visual na loja:

- Use imagens com dimensões exatas de **1920 x 580 pixels**
- Mantenha o tamanho do arquivo abaixo de 5MB
- Formatos suportados: JPEG, PNG, WEBP ou GIF
- Posicione elementos importantes no centro da imagem
- Se ativar o "Texto Sobreposto", o sistema exibirá o nome e descrição da loja sobre o banner
- Teste o banner em dispositivos móveis e desktop para garantir boa visualização

Se continuar encontrando problemas, verifique o console do navegador para mensagens de erro mais detalhadas.

## 5. Problemas Comuns

- **"jwt expired"**: Sua sessão expirou, faça login novamente ou configure a chave de serviço.
- **"Bucket not found"**: O bucket não existe ou você não tem permissões para acessá-lo.
- **Erro 400 (Bad Request)**: Configuração de CORS incorreta ou problema com o formato da requisição.
- **Erro 403 (Forbidden)**: Problemas de permissão ou autenticação.

## 6. Mais Informações

Para mais detalhes sobre o Storage do Supabase, consulte a [documentação oficial](https://supabase.com/docs/guides/storage). 