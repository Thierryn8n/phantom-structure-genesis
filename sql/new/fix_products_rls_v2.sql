-- Script para corrigir políticas RLS da tabela products - Versão 2
-- Este script remove TODAS as políticas existentes antes de criar novas

-- Remover TODAS as políticas existentes na tabela products
DO $$
DECLARE
  pol_name TEXT;
BEGIN
  FOR pol_name IN 
    SELECT polname FROM pg_policy WHERE polrelid = 'public.products'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol_name);
    RAISE NOTICE 'Política removida: %', pol_name;
  END LOOP;
END
$$;

-- Garantir que RLS esteja habilitado
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas com nomes claros e consistentes
CREATE POLICY "products_select_policy" 
ON public.products
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "products_insert_policy" 
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "products_update_policy" 
ON public.products
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "products_delete_policy" 
ON public.products
FOR DELETE
USING (auth.uid() = owner_id);

-- Política para acesso administrativo
CREATE POLICY "products_admin_policy"
ON public.products
FOR ALL
TO service_role
USING (true);

-- Verificar se as políticas foram criadas corretamente
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