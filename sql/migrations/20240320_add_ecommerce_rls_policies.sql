-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON ecommerce_categories;
DROP POLICY IF EXISTS "Permitir inserção pública de categorias" ON ecommerce_categories;
DROP POLICY IF EXISTS "Permitir leitura pública de configurações" ON ecommerce_settings;
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON products;
DROP POLICY IF EXISTS "Permitir leitura pública de avaliações" ON product_reviews;
DROP POLICY IF EXISTS "Permitir inserção de avaliações por anônimos" ON product_reviews;
DROP POLICY IF EXISTS "orders_kanban_select_policy" ON orders_kanban;

-- Habilitar RLS (Row Level Security) para as tabelas
ALTER TABLE ecommerce_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_kanban ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
CREATE POLICY "Permitir leitura pública de categorias" ON ecommerce_categories
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Permitir inserção de categorias por usuários autenticados" ON ecommerce_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir leitura pública de configurações da loja
CREATE POLICY "Permitir leitura pública de configurações" ON ecommerce_settings
    FOR SELECT
    TO public
    USING (true);

-- Política para permitir leitura pública de produtos
CREATE POLICY "Permitir leitura pública de produtos" ON products
    FOR SELECT
    TO public
    USING (true);

-- Política para permitir leitura pública de avaliações
CREATE POLICY "Permitir leitura pública de avaliações" ON product_reviews
    FOR SELECT
    TO public
    USING (true);

-- Política para permitir inserção de avaliações por usuários anônimos
CREATE POLICY "Permitir inserção de avaliações por anônimos" ON product_reviews
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Política para permitir leitura de pedidos no kanban
CREATE POLICY "orders_kanban_select_policy" ON orders_kanban
    FOR SELECT
    TO public
    USING (true);

-- Comentários explicativos
COMMENT ON POLICY "Permitir leitura pública de categorias" ON ecommerce_categories IS 'Permite que qualquer usuário (autenticado ou não) visualize as categorias';
COMMENT ON POLICY "Permitir inserção de categorias por usuários autenticados" ON ecommerce_categories IS 'Permite que apenas usuários autenticados criem novas categorias';
COMMENT ON POLICY "Permitir leitura pública de configurações" ON ecommerce_settings IS 'Permite que qualquer usuário (autenticado ou não) visualize as configurações da loja';
COMMENT ON POLICY "Permitir leitura pública de produtos" ON products IS 'Permite que qualquer usuário (autenticado ou não) visualize os produtos';
COMMENT ON POLICY "Permitir leitura pública de avaliações" ON product_reviews IS 'Permite que qualquer usuário (autenticado ou não) visualize as avaliações';
COMMENT ON POLICY "Permitir inserção de avaliações por anônimos" ON product_reviews IS 'Permite que usuários não autenticados possam adicionar avaliações';
COMMENT ON POLICY "orders_kanban_select_policy" ON orders_kanban IS 'Permite que qualquer usuário (autenticado ou não) visualize os pedidos no kanban'; 