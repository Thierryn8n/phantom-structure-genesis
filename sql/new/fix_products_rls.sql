-- Script para corrigir políticas RLS da tabela products
-- Esse script corrige o problema onde a tabela usa owner_id mas as políticas podem estar usando user_id

-- Primeiro, vamos desativar as políticas existentes para products
DROP POLICY IF EXISTS "Usuários podem ver seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios produtos" ON products;

-- Agora, vamos recriar as políticas usando owner_id
CREATE POLICY "Usuários podem ver seus próprios produtos"
ON public.products
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Usuários podem inserir seus próprios produtos"
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Usuários podem atualizar seus próprios produtos"
ON public.products
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Usuários podem deletar seus próprios produtos"
ON public.products
FOR DELETE
USING (auth.uid() = owner_id);

-- Verifica se RLS está ativado na tabela
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Adicione uma política para permitir operações com serviço admin (opcional)
CREATE POLICY "Serviço Admin pode acessar todos os produtos"
ON public.products
FOR ALL
TO service_role
USING (true);

-- Verificar as políticas após alterações
SELECT 
  polname, 
  polcmd, 
  polpermissive, 
  polroles,
  polqual
FROM 
  pg_policy
WHERE 
  polrelid = 'public.products'::regclass; 