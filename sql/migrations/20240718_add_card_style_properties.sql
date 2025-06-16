-- Adiciona novas colunas para personalização dos cards de produtos
ALTER TABLE ecommerce_product_card_styles
ADD COLUMN IF NOT EXISTS card_background_color VARCHAR(50) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS card_border_color VARCHAR(50) DEFAULT '#e5e7eb',
ADD COLUMN IF NOT EXISTS card_border_width INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS card_border_radius INTEGER DEFAULT 5;

-- Atualiza os estilos existentes com os valores padrão
UPDATE ecommerce_product_card_styles
SET 
  card_background_color = '#ffffff',
  card_border_color = '#e5e7eb',
  card_border_width = 1,
  card_border_radius = 5
WHERE card_background_color IS NULL
  OR card_border_color IS NULL
  OR card_border_width IS NULL
  OR card_border_radius IS NULL; 