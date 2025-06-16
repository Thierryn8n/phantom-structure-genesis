-- Script para corrigir permissões RLS na tabela products
-- Este script verifica se a tabela existe e recria as políticas de RLS

BEGIN;

-- Verificar se a tabela products existe
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE 'Tabela products encontrada. Prosseguindo com verificação de RLS.';
  ELSE
    RAISE EXCEPTION 'Tabela products não existe! Execute o script create_products_table.sql primeiro.';
  END IF;
END
$$;

-- Verificar e habilitar RLS
DO $$
BEGIN
  IF NOT exists (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'products' 
    AND rowsecurity = TRUE
  ) THEN
    RAISE NOTICE 'Habilitando Row Level Security para a tabela products...';
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'Row Level Security já está habilitado para a tabela products.';
  END IF;
END
$$;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Usuários só podem gerenciar seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios produtos" ON products;

-- Criar políticas de RLS mais granulares
CREATE POLICY "Usuários podem visualizar seus próprios produtos"
ON products
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Usuários podem inserir seus próprios produtos"
ON products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Usuários podem atualizar seus próprios produtos"
ON products
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Usuários podem excluir seus próprios produtos"
ON products
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Verificar permissões de acesso do esquema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.products TO authenticated;

-- Verificar sequências
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN SELECT pg_class.relname FROM pg_class 
                    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
                    WHERE pg_class.relkind = 'S' AND pg_namespace.nspname = 'public' AND 
                          pg_class.relname LIKE '%products%'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO authenticated', seq_name);
        RAISE NOTICE 'Concedida permissão para sequência: %', seq_name;
    END LOOP;
END
$$;

-- Verificar se existe algum produto já cadastrado
DO $$
DECLARE
    product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products;
    
    IF product_count > 0 THEN
        RAISE NOTICE 'Existem % produtos cadastrados na tabela', product_count;
    ELSE
        RAISE NOTICE 'Não existem produtos cadastrados na tabela';
    END IF;
END
$$;

COMMIT;

-- Instruções para o usuário:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique os logs para confirmar que as políticas foram aplicadas
-- 3. Recarregue a aplicação para testar novamente o acesso aos produtos 