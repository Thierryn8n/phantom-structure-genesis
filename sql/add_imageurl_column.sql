-- Script para adicionar a coluna imageUrl à tabela products
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna imageUrl se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'imageUrl'
  ) THEN
    ALTER TABLE products ADD COLUMN "imageUrl" VARCHAR(255);
    RAISE NOTICE 'Coluna imageUrl adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna imageUrl já existe!';
  END IF;
END
$$;

-- Verificar se a coluna foi criada
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'products'
AND column_name IN ('imageUrl', 'image_path')
ORDER BY column_name;