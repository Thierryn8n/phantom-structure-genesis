-- Adiciona a coluna icon à tabela ecommerce_categories
ALTER TABLE ecommerce_categories
ADD COLUMN icon text;

-- Atualiza as políticas de RLS para incluir o novo campo
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON ecommerce_categories;
DROP POLICY IF EXISTS "Permitir inserção de categorias por usuários autenticados" ON ecommerce_categories;

CREATE POLICY "Permitir leitura pública de categorias" ON ecommerce_categories
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Permitir inserção de categorias por usuários autenticados" ON ecommerce_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.role() = 'authenticated');

-- Comentários
COMMENT ON COLUMN ecommerce_categories.icon IS 'Nome do ícone Lucide para a categoria'; 