-- FISCAL FLOW - SCHEMA DE VENDEDORES E ARMAZENAMENTO
-- Este script configura toda a estrutura necessária para gerenciar vendedores
-- Inclui: tabelas, triggers, RLS (Row Level Security), buckets e permissões

-- Configurar extensions necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    auth_user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    image_path TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários na tabela para documentação
COMMENT ON TABLE public.sellers IS 'Tabela de vendedores associados a uma conta';
COMMENT ON COLUMN public.sellers.owner_id IS 'ID do usuário proprietário (dono da conta)';
COMMENT ON COLUMN public.sellers.auth_user_id IS 'ID do usuário de autenticação do vendedor, se aplicável';

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sellers_updated_at ON public.sellers;
CREATE TRIGGER sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para desativar vendedor sem excluir (soft delete)
CREATE OR REPLACE FUNCTION public.deactivate_seller(p_seller_id UUID, p_owner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.sellers
    SET active = FALSE
    WHERE id = p_seller_id AND owner_id = p_owner_id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar a imagem do vendedor
CREATE OR REPLACE FUNCTION public.update_seller_image(p_seller_id UUID, p_image_path TEXT, p_owner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.sellers
    SET image_path = p_image_path
    WHERE id = p_seller_id AND owner_id = p_owner_id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configuração de Row Level Security (RLS)
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Política de acesso para leitura (owner pode ler seus próprios vendedores)
DROP POLICY IF EXISTS sellers_select_policy ON public.sellers;
CREATE POLICY sellers_select_policy ON public.sellers
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        auth_user_id = auth.uid()
    );

-- Política de acesso para inserção (owner pode inserir novos vendedores)
DROP POLICY IF EXISTS sellers_insert_policy ON public.sellers;
CREATE POLICY sellers_insert_policy ON public.sellers
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()
    );

-- Política de acesso para atualização (owner pode atualizar seus próprios vendedores)
DROP POLICY IF EXISTS sellers_update_policy ON public.sellers;
CREATE POLICY sellers_update_policy ON public.sellers
    FOR UPDATE USING (
        owner_id = auth.uid()
    );

-- Política de acesso para exclusão (owner pode excluir seus próprios vendedores)
DROP POLICY IF EXISTS sellers_delete_policy ON public.sellers;
CREATE POLICY sellers_delete_policy ON public.sellers
    FOR DELETE USING (
        owner_id = auth.uid()
    );

-- Configuração de Storage para imagens de vendedores
-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('sellers_images', 'Imagens de Vendedores', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket de imagens de vendedores
DROP POLICY IF EXISTS sellers_images_select_policy ON storage.objects;
CREATE POLICY sellers_images_select_policy ON storage.objects
    FOR SELECT USING (
        bucket_id = 'sellers_images' AND (
            -- Qualquer um pode visualizar imagens públicas 
            (storage.foldername(name))[1] = 'public' OR
            -- Usuário pode visualizar suas próprias imagens
            auth.uid()::text = (storage.foldername(name))[1]
        )
    );

DROP POLICY IF EXISTS sellers_images_insert_policy ON storage.objects;
CREATE POLICY sellers_images_insert_policy ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'sellers_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS sellers_images_update_policy ON storage.objects;
CREATE POLICY sellers_images_update_policy ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'sellers_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS sellers_images_delete_policy ON storage.objects;
CREATE POLICY sellers_images_delete_policy ON storage.objects
    FOR DELETE USING (
        bucket_id = 'sellers_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Conceder permissões públicas para o papel anônimo e autenticado
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.sellers TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_seller TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_seller_image TO anon, authenticated;

-- Configurar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_sellers_owner_id ON public.sellers(owner_id);
CREATE INDEX IF NOT EXISTS idx_sellers_auth_user_id ON public.sellers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON public.sellers(active); 