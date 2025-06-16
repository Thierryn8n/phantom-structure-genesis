-- Adiciona a coluna theme_id à tabela ecommerce_settings
ALTER TABLE ecommerce_settings
ADD COLUMN theme_id VARCHAR(50);

-- Atualiza os registros existentes para usar o tema moderno como padrão
UPDATE ecommerce_settings
SET theme_id = 'moderno'
WHERE theme_id IS NULL; 