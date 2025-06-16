-- Script simplificado para criar as tabelas de configurações do e-commerce
-- Este script cria apenas as tabelas sem verificações complexas

-- Criar tabela de controle de versão se não existir
CREATE TABLE IF NOT EXISTS migration_versions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de papéis de usuário (roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Criação da tabela de configurações do e-commerce
CREATE TABLE IF NOT EXISTS ecommerce_settings (
  id SERIAL PRIMARY KEY,
  
  -- Aparência
  primary_color VARCHAR(20) DEFAULT '#f59e0b',
  secondary_color VARCHAR(20) DEFAULT '#000000',
  accent_color VARCHAR(20) DEFAULT '#4b5563',
  background_color VARCHAR(20) DEFAULT '#ffffff',
  header_background_color VARCHAR(20) DEFAULT '#ffffff',
  footer_background_color VARCHAR(20) DEFAULT '#000000',
  font_family VARCHAR(50) DEFAULT 'Inter',
  button_style VARCHAR(20) DEFAULT 'filled',
  border_radius INTEGER DEFAULT 4,
  
  -- Logotipo e imagens
  logo_url TEXT DEFAULT '',
  logo_width INTEGER DEFAULT 120,
  favicon_url TEXT DEFAULT '',
  banner_image_url TEXT DEFAULT '',
  use_overlay_text BOOLEAN DEFAULT TRUE,
  
  -- Layout da loja
  product_cards_per_row INTEGER DEFAULT 4,
  show_product_ratings BOOLEAN DEFAULT TRUE,
  show_discount_badge BOOLEAN DEFAULT TRUE,
  display_product_quick_view BOOLEAN DEFAULT TRUE,
  enable_wishlist BOOLEAN DEFAULT TRUE,
  show_social_share_buttons BOOLEAN DEFAULT TRUE,
  
  -- SEO e Metadata
  store_name VARCHAR(100) DEFAULT 'TOOLPART',
  store_description TEXT DEFAULT 'Loja de ferramentas e peças para profissionais',
  meta_keywords TEXT DEFAULT 'ferramentas, peças, equipamentos, profissionais',
  
  -- Informações adicionais
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar o desempenho
CREATE INDEX IF NOT EXISTS idx_ecommerce_settings_owner ON ecommerce_settings(owner_id);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_ecommerce_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp de updated_at
DROP TRIGGER IF EXISTS update_ecommerce_settings_updated_at ON ecommerce_settings;
CREATE TRIGGER update_ecommerce_settings_updated_at
BEFORE UPDATE ON ecommerce_settings
FOR EACH ROW
EXECUTE FUNCTION update_ecommerce_settings_updated_at();

-- Inserir configurações padrão se não existirem
INSERT INTO ecommerce_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Permissões RLS (Row Level Security)
ALTER TABLE ecommerce_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar erros de duplicação
DO $$
BEGIN
  -- Verificar e remover política de visualização
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ecommerce_settings' AND policyname = 'Users can view ecommerce settings'
  ) THEN
    DROP POLICY "Users can view ecommerce settings" ON ecommerce_settings;
  END IF;
  
  -- Verificar e remover política de edição
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ecommerce_settings' AND policyname = 'Admins can edit ecommerce settings'
  ) THEN
    DROP POLICY "Admins can edit ecommerce settings" ON ecommerce_settings;
  END IF;
END
$$;

-- Política para permitir que qualquer usuário possa visualizar as configurações
CREATE POLICY "Users can view ecommerce settings" ON ecommerce_settings
FOR SELECT
USING (true);

-- Política para permitir que apenas administradores possam editar
CREATE POLICY "Admins can edit ecommerce settings" ON ecommerce_settings
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Criar tabela para temas predefinidos
CREATE TABLE IF NOT EXISTS ecommerce_themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Aparência
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  accent_color VARCHAR(20) NOT NULL,
  background_color VARCHAR(20) NOT NULL,
  header_background_color VARCHAR(20) NOT NULL,
  footer_background_color VARCHAR(20) NOT NULL,
  font_family VARCHAR(50) NOT NULL,
  button_style VARCHAR(20) NOT NULL,
  border_radius INTEGER NOT NULL,
  
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar alguns temas predefinidos
INSERT INTO ecommerce_themes (
  name, 
  description, 
  primary_color, 
  secondary_color, 
  accent_color, 
  background_color, 
  header_background_color, 
  footer_background_color, 
  font_family, 
  button_style, 
  border_radius,
  is_default
) VALUES
(
  'Toolpart Amarelo', 
  'Tema padrão com esquema de cores amarelo e preto', 
  '#f59e0b', 
  '#000000', 
  '#4b5563', 
  '#ffffff', 
  '#ffffff', 
  '#000000', 
  'Inter', 
  'filled', 
  4,
  TRUE
),
(
  'Profissional Azul', 
  'Tema profissional com tons de azul', 
  '#2563eb', 
  '#1e3a8a', 
  '#3b82f6', 
  '#f8fafc', 
  '#ffffff', 
  '#1e3a8a', 
  'Roboto', 
  'filled', 
  6,
  FALSE
),
(
  'Moderno Minimalista', 
  'Design minimalista com tons neutros', 
  '#000000', 
  '#404040', 
  '#f43f5e', 
  '#ffffff', 
  '#ffffff', 
  '#000000', 
  'Montserrat', 
  'outline', 
  0,
  FALSE
),
(
  'Verde Natureza', 
  'Tema inspirado na natureza com tons de verde', 
  '#059669', 
  '#065f46', 
  '#fbbf24', 
  '#f0fdf4', 
  '#ffffff', 
  '#065f46', 
  'Poppins', 
  'filled', 
  8,
  FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Tabela para armazenar configurações específicas de cartões de produtos
CREATE TABLE IF NOT EXISTS ecommerce_product_card_styles (
  id SERIAL PRIMARY KEY,
  settings_id INTEGER REFERENCES ecommerce_settings(id) ON DELETE CASCADE,
  
  -- Estilos do cartão
  card_border_enabled BOOLEAN DEFAULT TRUE,
  card_shadow_enabled BOOLEAN DEFAULT TRUE,
  card_shadow_intensity INTEGER DEFAULT 1, -- 1-5
  card_hover_effect VARCHAR(20) DEFAULT 'scale', -- 'scale', 'elevate', 'border', 'none'
  
  -- Estilos da imagem do produto
  image_aspect_ratio VARCHAR(20) DEFAULT '1:1', -- '1:1', '4:3', '16:9', etc.
  image_fit VARCHAR(20) DEFAULT 'cover', -- 'cover', 'contain'
  
  -- Conteúdo do cartão
  display_product_name BOOLEAN DEFAULT TRUE,
  display_price BOOLEAN DEFAULT TRUE,
  display_original_price BOOLEAN DEFAULT TRUE,
  display_discount_percentage BOOLEAN DEFAULT TRUE,
  
  -- Botões
  button_text VARCHAR(100) DEFAULT 'Adicionar ao carrinho',
  secondary_button_enabled BOOLEAN DEFAULT TRUE,
  secondary_button_text VARCHAR(100) DEFAULT 'Ver detalhes',
  buttons_display_style VARCHAR(20) DEFAULT 'always', -- 'always', 'hover', 'bottom'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Adicionar restrição UNIQUE para permitir ON CONFLICT
  CONSTRAINT unique_settings_id UNIQUE (settings_id)
);

-- Inserir estilo padrão para cartões de produtos
INSERT INTO ecommerce_product_card_styles (settings_id)
VALUES (1)
ON CONFLICT (settings_id) DO NOTHING;

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_product_card_styles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp de updated_at
DROP TRIGGER IF EXISTS update_product_card_styles_updated_at ON ecommerce_product_card_styles;
CREATE TRIGGER update_product_card_styles_updated_at
BEFORE UPDATE ON ecommerce_product_card_styles
FOR EACH ROW
EXECUTE FUNCTION update_product_card_styles_updated_at();

-- Registrar a migração como aplicada
INSERT INTO migration_versions (name) VALUES ('20230808_create_ecommerce_settings')
ON CONFLICT (name) DO NOTHING;

-- Criar usuário admin (simples, sem blocos DO)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING; 