-- Criar bucket para armazenamento de imagens de produtos
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('products', 'products', true, false)
ON CONFLICT (id) DO NOTHING;

-- Definir políticas de acesso para armazenamento de produtos
-- Permitir que qualquer usuário autenticado visualize as imagens
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "products_images_select_policy" ON storage.objects;
    CREATE POLICY "products_images_select_policy"
    ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'products');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Política de seleção já existe';
  END;

  BEGIN
    DROP POLICY IF EXISTS "products_images_insert_policy" ON storage.objects;
    CREATE POLICY "products_images_insert_policy"
    ON storage.objects
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'products' AND 
      auth.role() = 'authenticated'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Política de inserção já existe';
  END;

  BEGIN
    DROP POLICY IF EXISTS "products_images_update_policy" ON storage.objects;
    CREATE POLICY "products_images_update_policy"
    ON storage.objects
    FOR UPDATE 
    USING (
      bucket_id = 'products' AND 
      auth.uid() = owner
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Política de atualização já existe';
  END;

  BEGIN
    DROP POLICY IF EXISTS "products_images_delete_policy" ON storage.objects;
    CREATE POLICY "products_images_delete_policy"
    ON storage.objects
    FOR DELETE 
    USING (
      bucket_id = 'products' AND 
      auth.uid() = owner
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Política de exclusão já existe';
  END;
END
$$; 