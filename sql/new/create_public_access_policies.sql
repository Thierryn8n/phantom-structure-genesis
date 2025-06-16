-- Script para adicionar políticas de acesso público às tabelas de e-commerce
-- Este script configura as permissões necessárias para permitir acesso anônimo
-- às tabelas relacionadas ao e-commerce (produtos, categorias e configurações)

-- Registrar a versão da migração
CREATE TABLE IF NOT EXISTS migration_versions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- POLÍTICAS PARA TABELA PRODUCTS
-- ===========================================================================
-- Permitir acesso de leitura anônimo à tabela de produtos
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Remover política de visualização existente se necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable public products read access'
  ) THEN
    DROP POLICY "Enable public products read access" ON products;
  END IF;
END
$$;

-- Criar política que permite acesso público (anônimo) para leitura de produtos
CREATE POLICY "Enable public products read access" 
ON public.products
FOR SELECT 
USING (true);

-- ===========================================================================
-- POLÍTICAS PARA TABELA ECOMMERCE_CATEGORIES
-- ===========================================================================
-- Permitir acesso de leitura anônimo à tabela de categorias
ALTER TABLE public.ecommerce_categories ENABLE ROW LEVEL SECURITY;

-- Remover política de visualização existente se necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ecommerce_categories' AND policyname = 'Enable public categories read access'
  ) THEN
    DROP POLICY "Enable public categories read access" ON ecommerce_categories;
  END IF;
END
$$;

-- Criar política que permite acesso público (anônimo) para leitura de categorias
CREATE POLICY "Enable public categories read access" 
ON public.ecommerce_categories
FOR SELECT 
USING (true);

-- ===========================================================================
-- POLÍTICAS PARA TABELA ECOMMERCE_SETTINGS
-- ===========================================================================
-- Permitir acesso de leitura anônimo à tabela de configurações do e-commerce
ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;

-- Remover política de visualização existente se necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ecommerce_settings' AND policyname = 'Enable public settings read access'
  ) THEN
    DROP POLICY "Enable public settings read access" ON ecommerce_settings;
  END IF;
END
$$;

-- Criar política que permite acesso público (anônimo) para leitura de configurações
CREATE POLICY "Enable public settings read access" 
ON public.ecommerce_settings
FOR SELECT 
USING (true);

-- Registrar a migração como aplicada
INSERT INTO migration_versions (name) VALUES ('20240615_add_public_access_policies')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Instrução para diagnóstico pós-execução
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE 
  tablename IN ('products', 'ecommerce_categories', 'ecommerce_settings')
  AND (policyname LIKE '%public%' OR policyname LIKE '%Enable%'); 