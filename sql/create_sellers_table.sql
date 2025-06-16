-- Verifica se a tabela "sellers" já existe e cria caso não exista
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  imageUrl TEXT,
  image_path TEXT,  -- Caminho da imagem no storage
  email TEXT UNIQUE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Garante que a coluna image_path exista (caso a tabela já existisse antes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'sellers'
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE public.sellers ADD COLUMN image_path TEXT;
  END IF;
END
$$;

-- Adiciona função de trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria ou atualiza o trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.sellers;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Cria um bucket para armazenar imagens de vendedores
-- Nota: execute estas funções com privilégios de serviço no Supabase
DO $$
BEGIN
  -- Cria o bucket se não existir
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'sellers_images') THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection)
    VALUES ('sellers_images', 'sellers_images', TRUE, FALSE);
  END IF;
END
$$;

-- Configura políticas de acesso para o bucket de imagens
BEGIN;
  -- Remove políticas existentes se já existirem
  DROP POLICY IF EXISTS "Imagens de vendedores são públicas para visualização" ON storage.objects;
  DROP POLICY IF EXISTS "Proprietários podem fazer upload de imagens" ON storage.objects;
  DROP POLICY IF EXISTS "Proprietários podem remover imagens" ON storage.objects;

  -- Política que permite que qualquer pessoa visualize imagens de vendedores
  CREATE POLICY "Imagens de vendedores são públicas para visualização"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'sellers_images' AND (auth.role() = 'authenticated' OR auth.role() = 'anon'));
  
  -- Política que permite que apenas proprietários façam upload de imagens
  CREATE POLICY "Proprietários podem fazer upload de imagens"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'sellers_images' AND auth.uid() IN (SELECT owner_id FROM public.sellers));
  
  -- Política que permite que apenas proprietários removam imagens
  CREATE POLICY "Proprietários podem remover imagens"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'sellers_images' AND auth.uid() IN (SELECT owner_id FROM public.sellers));
COMMIT;

-- Ajusta permissões para operações CRUD
-- Configura políticas de acesso RLS (Row Level Security)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes (se houver)
DROP POLICY IF EXISTS "Proprietários podem ver e gerenciar seus vendedores" ON public.sellers;
DROP POLICY IF EXISTS "Vendedores podem ver apenas seus próprios dados" ON public.sellers;

-- Política para o dono da loja ver todos os seus vendedores
CREATE POLICY "Proprietários podem ver e gerenciar seus vendedores" 
ON public.sellers
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Política para vendedores verem apenas seus próprios dados
CREATE POLICY "Vendedores podem ver apenas seus próprios dados" 
ON public.sellers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Função para criar um novo vendedor com conta de usuário
CREATE OR REPLACE FUNCTION create_seller_with_account(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_password TEXT,
  p_owner_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_seller_id UUID;
BEGIN
  -- Criar conta de usuário no auth.users
  INSERT INTO auth.users (email, password, email_confirmed_at)
  VALUES (p_email, p_password, NOW())
  RETURNING id INTO v_user_id;
  
  -- Definir role como 'seller'
  INSERT INTO auth.users_roles (user_id, role)
  VALUES (v_user_id, 'seller');
  
  -- Criar perfil do vendedor
  INSERT INTO public.sellers (
    full_name,
    email,
    phone,
    auth_user_id,
    owner_id
  )
  VALUES (
    p_full_name,
    p_email,
    p_phone,
    v_user_id,
    p_owner_id
  )
  RETURNING id INTO v_seller_id;
  
  RETURN v_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar a imagem do vendedor
CREATE OR REPLACE FUNCTION update_seller_image(
  p_seller_id UUID,
  p_image_path TEXT,
  p_owner_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Verificar se o proprietário é dono deste vendedor
  IF EXISTS (
    SELECT 1 FROM public.sellers 
    WHERE id = p_seller_id AND owner_id = p_owner_id
  ) THEN
    -- Construir URL completa para o storage do Supabase
    UPDATE public.sellers
    SET image_path = p_image_path,
        imageUrl = storage_public_url('sellers_images', p_image_path)
    WHERE id = p_seller_id;
    
    v_success := TRUE;
  ELSE
    v_success := FALSE;
  END IF;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter a URL pública do storage
CREATE OR REPLACE FUNCTION storage_public_url(bucket TEXT, file_path TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://bbqtnkqjvhzhxdmjmqtt.supabase.co/storage/v1/object/public/' || bucket || '/' || file_path;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Criar função para desativar conta de vendedor
CREATE OR REPLACE FUNCTION deactivate_seller(
  p_seller_id UUID,
  p_owner_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Verificar se o proprietário é dono deste vendedor
  IF EXISTS (
    SELECT 1 FROM public.sellers 
    WHERE id = p_seller_id AND owner_id = p_owner_id
  ) THEN
    -- Desativar vendedor 
    UPDATE public.sellers
    SET active = FALSE
    WHERE id = p_seller_id;
    
    v_success := TRUE;
  ELSE
    v_success := FALSE;
  END IF;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários da tabela e colunas para melhor documentação
COMMENT ON TABLE public.sellers IS 'Tabela para armazenar informações dos vendedores';
COMMENT ON COLUMN public.sellers.id IS 'Identificador único do vendedor';
COMMENT ON COLUMN public.sellers.full_name IS 'Nome completo do vendedor';
COMMENT ON COLUMN public.sellers.phone IS 'Número de telefone do vendedor';
COMMENT ON COLUMN public.sellers.email IS 'Email do vendedor (usado para login)';
COMMENT ON COLUMN public.sellers.auth_user_id IS 'Referência ao ID do usuário no auth.users';
COMMENT ON COLUMN public.sellers.owner_id IS 'ID do proprietário/dono da loja que cadastrou este vendedor';
COMMENT ON COLUMN public.sellers.imageUrl IS 'URL completa da imagem do perfil do vendedor';
COMMENT ON COLUMN public.sellers.image_path IS 'Caminho relativo da imagem no bucket do storage';
COMMENT ON COLUMN public.sellers.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.sellers.updated_at IS 'Data da última atualização do registro';
COMMENT ON COLUMN public.sellers.active IS 'Indica se o vendedor está ativo';

-- Cria índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_sellers_full_name ON public.sellers(full_name);
CREATE INDEX IF NOT EXISTS idx_sellers_phone ON public.sellers(phone);
CREATE INDEX IF NOT EXISTS idx_sellers_email ON public.sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_auth_user_id ON public.sellers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_owner_id ON public.sellers(owner_id); 