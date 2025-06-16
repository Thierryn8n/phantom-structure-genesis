-- Adicionar a coluna categoria_id à tabela de produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.ecommerce_categories(id) ON DELETE SET NULL;

-- Adicionar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);

-- Migrar dados existentes: copiar os valores da coluna 'category' (string) para as categorias
-- correspondentes na nova tabela ecommerce_categories

-- Primeiro, vamos criar uma função temporária para ajudar nessa migração
CREATE OR REPLACE FUNCTION migrate_product_categories() 
RETURNS void AS $$
DECLARE
    product_record RECORD;
    category_id UUID;
BEGIN
    -- Para cada produto com categoria preenchida
    FOR product_record IN 
        SELECT id, category FROM products 
        WHERE category IS NOT NULL AND category != ''
    LOOP
        -- Verificar se a categoria já existe na tabela ecommerce_categories
        SELECT id INTO category_id FROM ecommerce_categories 
        WHERE name = product_record.category
        LIMIT 1;
        
        -- Se não existir, criar a categoria
        IF category_id IS NULL THEN
            INSERT INTO ecommerce_categories (name, description, created_at, updated_at)
            VALUES (product_record.category, 'Categoria migrada automaticamente', NOW(), NOW())
            RETURNING id INTO category_id;
        END IF;
        
        -- Atualizar o produto com o category_id correto
        UPDATE products
        SET category_id = category_id
        WHERE id = product_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função de migração se a coluna category existir
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category'
    ) THEN
        PERFORM migrate_product_categories();
    END IF;
END $$;

-- Remover a função temporária
DROP FUNCTION IF EXISTS migrate_product_categories();

-- Atualizar o serviço para usar a nova coluna
COMMENT ON COLUMN products.category_id IS 'Referência à tabela ecommerce_categories, substituindo o campo category (string)'; 