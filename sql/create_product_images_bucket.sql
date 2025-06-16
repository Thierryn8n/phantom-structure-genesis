-- Criação de um bucket no Supabase Storage para imagens de produtos
BEGIN;
  -- Verificar se o bucket já existe antes de criá-lo
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
      VALUES (
        'product-images', 
        'product-images', 
        true, 
        false, 
        5242880, -- 5MB
        '{image/png,image/jpeg,image/jpg,image/webp,image/gif}'
      );
    END IF;
  END
  $$;

  -- Remover políticas existentes para evitar conflitos
  DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens de produtos" ON storage.objects;
  DROP POLICY IF EXISTS "Todos podem visualizar imagens de produtos" ON storage.objects;
  DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias imagens" ON storage.objects;
  DROP POLICY IF EXISTS "Usuários podem excluir suas próprias imagens" ON storage.objects;

-- Política de acesso para permitir que usuários autenticados façam upload de imagens
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de produtos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

-- Política de acesso para permitir que todos visualizem as imagens
CREATE POLICY "Todos podem visualizar imagens de produtos"
ON storage.objects
FOR SELECT
  TO anon, authenticated
USING (
  bucket_id = 'product-images'
);

-- Política para permitir que usuários autenticados atualizem suas próprias imagens
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);

-- Política para permitir que usuários autenticados excluam suas próprias imagens
CREATE POLICY "Usuários podem excluir suas próprias imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);

  -- Função auxiliar para obter a URL pública de uma imagem
  CREATE OR REPLACE FUNCTION get_product_image_url(file_path TEXT)
  RETURNS TEXT AS $$
  DECLARE
    bucket_name TEXT := 'product-images';
    base_url TEXT;
  BEGIN
    -- Obter URL base do Supabase armazenado na configuração
    SELECT value INTO base_url FROM storage.buckets WHERE id = bucket_name;
    
    IF base_url IS NULL THEN
      -- Se não estiver disponível, usar um formato padrão
      RETURN '/storage/v1/object/public/' || bucket_name || '/' || file_path;
    ELSE
      RETURN base_url || '/' || file_path;
    END IF;
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  -- Trigger para atualizar o imageUrl quando o image_path for alterado
  CREATE OR REPLACE FUNCTION update_product_image_url()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.image_path IS NOT NULL AND (OLD.image_path IS NULL OR NEW.image_path <> OLD.image_path) THEN
      NEW.imageUrl := get_product_image_url(NEW.image_path);
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Criar ou substituir o trigger na tabela de produtos
  DROP TRIGGER IF EXISTS update_product_image_url ON products;
  CREATE TRIGGER update_product_image_url
  BEFORE INSERT OR UPDATE OF image_path ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_image_url();
COMMIT;
