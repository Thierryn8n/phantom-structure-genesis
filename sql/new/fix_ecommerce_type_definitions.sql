-- Script para corrigir definições de tipos nas tabelas de e-commerce
-- Este script atualiza o arquivo de tipos do Supabase para incluir as tabelas e campos de e-commerce
-- Isso resolverá os erros de tipagem no cliente TypeScript

-- Registrar a versão da migração
CREATE TABLE IF NOT EXISTS migration_versions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- VERIFICAÇÃO DAS TABELAS
-- ===========================================================================
-- Verifica se as tabelas existem antes de prosseguir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ecommerce_categories'
  ) THEN
    RAISE EXCEPTION 'Tabela ecommerce_categories não existe. Execute as migrações anteriores primeiro.';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ecommerce_settings'
  ) THEN
    RAISE EXCEPTION 'Tabela ecommerce_settings não existe. Execute as migrações anteriores primeiro.';
  END IF;
END
$$;

-- ===========================================================================
-- ATUALIZAÇÃO DE TIPOS NA TABELA ECOMMERCE_SETTINGS
-- ===========================================================================
-- Atualize as tabelas para garantir que os tipos correspondam às definições necessárias
-- Adicionar colunas que possam estar faltando na tabela de configurações

ALTER TABLE ecommerce_settings 
ADD COLUMN IF NOT EXISTS store_name VARCHAR(100) DEFAULT 'TOOLPART',
ADD COLUMN IF NOT EXISTS store_description TEXT DEFAULT 'Loja de ferramentas e peças para profissionais',
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS banner_image_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS use_overlay_text BOOLEAN DEFAULT TRUE;

-- ===========================================================================
-- ATUALIZAÇÃO DE TIPOS NA TABELA ECOMMERCE_CATEGORIES
-- ===========================================================================
-- Garantir que as colunas existam e tenham o tipo correto

-- Verifica se a tabela usa UUID ou SERIAL como tipo de ID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_categories' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- Converter para UUID se não for já
    ALTER TABLE ecommerce_categories 
    ALTER COLUMN id SET DATA TYPE UUID USING (gen_random_uuid());
  END IF;
  
  -- Garantir que tem coluna name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_categories' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE ecommerce_categories 
    ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Categoria sem nome';
  END IF;
  
  -- Garantir que tem coluna description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_categories' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE ecommerce_categories 
    ADD COLUMN description TEXT;
  END IF;
  
  -- Garantir que tem colunas de data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_categories' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE ecommerce_categories 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_categories' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE ecommerce_categories 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END
$$;

-- ===========================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
-- ===========================================================================
-- Adiciona índices para melhorar o desempenho de consultas comuns

-- Índice para buscas por nome de categoria
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_name 
ON ecommerce_categories (name);

-- Índice para configurações do ecommerce por owner
CREATE INDEX IF NOT EXISTS idx_ecommerce_settings_owner 
ON ecommerce_settings (owner_id);

-- ===========================================================================
-- GATILHOS PARA ATUALIZAÇÃO DE TIMESTAMPS
-- ===========================================================================
-- Cria funções e gatilhos para atualizar automaticamente o campo updated_at

-- Função para atualizar o timestamp de categorias
CREATE OR REPLACE FUNCTION update_ecommerce_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp de updated_at de categorias
DROP TRIGGER IF EXISTS update_ecommerce_categories_updated_at ON ecommerce_categories;
CREATE TRIGGER update_ecommerce_categories_updated_at
BEFORE UPDATE ON ecommerce_categories
FOR EACH ROW
EXECUTE FUNCTION update_ecommerce_categories_updated_at();

-- Registrar a migração como aplicada
INSERT INTO migration_versions (name) VALUES ('20240615_fix_ecommerce_type_definitions')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Instrução para diagnóstico pós-execução
SELECT 
  table_schema, 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name IN ('ecommerce_settings', 'ecommerce_categories')
ORDER BY 
  table_name, ordinal_position; 