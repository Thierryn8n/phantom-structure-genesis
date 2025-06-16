-- ======================================================================
-- SCRIPT PARA CRIAR A TABELA DE PRODUTOS
-- Este script verifica se a tabela existe antes de tentar fazer backup
-- ======================================================================

BEGIN;

-- Verificar se a tabela products existe e fazer backup se existir
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
    -- Criar tabela temporária para backup
    CREATE TEMP TABLE temp_products_backup AS
    SELECT * FROM products WHERE 1=1;
    
    -- Guardar contagem para verificação
    DECLARE
      product_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO product_count FROM products;
      RAISE NOTICE 'Backup de % produtos realizado', product_count;
    END;
    
    -- Remover triggers existentes
    DROP TRIGGER IF EXISTS set_product_total ON products;
    DROP TRIGGER IF EXISTS update_products_updated_at ON products;
    
    -- Remover políticas existentes
    DROP POLICY IF EXISTS "Usuários só podem gerenciar seus próprios produtos" ON products;
    
    -- Remover índices existentes 
    DROP INDEX IF EXISTS idx_products_name;
    DROP INDEX IF EXISTS idx_products_code;
    DROP INDEX IF EXISTS idx_products_ncm;
    
    -- Remover tabela existente
    DROP TABLE products;
    
    RAISE NOTICE 'Tabela products existente foi removida com backup';
  ELSE
    -- Criar tabela temporária vazia para manter o script consistente
    CREATE TEMP TABLE temp_products_backup (
      id UUID,
      name VARCHAR(255),
      code VARCHAR(50),
      price NUMERIC(10,2),
      description TEXT,
      image_path VARCHAR(255),
      imageUrl VARCHAR(255),
      ncm VARCHAR(20),
      unit VARCHAR(50),
      quantity NUMERIC(10,2),
      total NUMERIC(10,2),
      owner_id UUID,
      created_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE
    );
    
    RAISE NOTICE 'Tabela products não existia, será criada do zero';
  END IF;
END
$$;

-- Remover funções existentes
DROP FUNCTION IF EXISTS calculate_product_total() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Criar nova tabela de produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  image_path VARCHAR(255),
  imageUrl VARCHAR(255),
  ncm VARCHAR(20),
  unit VARCHAR(50),
  quantity NUMERIC(10,2),
  total NUMERIC(10,2),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para busca rápida
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_code ON products (code);
CREATE INDEX idx_products_ncm ON products (ncm);

-- Adicionar política de segurança baseada em linha (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem apenas seus próprios produtos
CREATE POLICY "Usuários só podem gerenciar seus próprios produtos"
ON products
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Função para calcular o valor total (preço * quantidade) ao inserir ou atualizar
CREATE OR REPLACE FUNCTION calculate_product_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.total := NEW.price * NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular o total automaticamente
CREATE TRIGGER set_product_total
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION calculate_product_total();

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Restaurar dados da tabela temporária (se houver)
INSERT INTO products (
  id, name, code, price, description, image_path, imageUrl, 
  ncm, unit, quantity, owner_id, created_at, updated_at
)
SELECT 
  id, name, code, price, description, image_path, imageUrl, 
  ncm, unit, quantity, owner_id, created_at, updated_at
FROM temp_products_backup
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Atualizar coluna total nos registros existentes
UPDATE products
SET total = price * quantity
WHERE total IS NULL AND price IS NOT NULL AND quantity IS NOT NULL;

-- Verificar a restauração de dados
DO $$
DECLARE
  original_count INTEGER;
  restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM temp_products_backup;
  SELECT COUNT(*) INTO restored_count FROM products;
  
  RAISE NOTICE 'Restaurados % de % produtos', restored_count, original_count;
  
  IF original_count > 0 AND original_count <> restored_count THEN
    RAISE WARNING 'Atenção: Nem todos os produtos foram restaurados!';
  END IF;
END$$;

-- Remover tabela temporária
DROP TABLE temp_products_backup;

COMMIT; 