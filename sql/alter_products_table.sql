-- Script para adicionar a coluna 'total' e as triggers relevantes à tabela de produtos existente

-- Adicionar a coluna total se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'total'
  ) THEN
    ALTER TABLE products ADD COLUMN total NUMERIC(10,2);
  END IF;
END
$$;

-- Adicionar o índice para NCM
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_products_ncm'
  ) THEN
    CREATE INDEX idx_products_ncm ON products(ncm);
  END IF;
END
$$;

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

-- Remover trigger se já existir para evitar duplicação
DROP TRIGGER IF EXISTS set_product_total ON products;

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

-- Remover trigger se já existir para evitar duplicação
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Atualizar registros existentes calculando o total
UPDATE products
SET total = price * quantity
WHERE total IS NULL AND price IS NOT NULL AND quantity IS NOT NULL; 