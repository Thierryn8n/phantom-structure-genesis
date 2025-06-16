-- Criar tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_data JSONB NOT NULL DEFAULT '{}',
  installment_fees JSONB NOT NULL DEFAULT '[]',
  delivery_settings JSONB NOT NULL DEFAULT '{"delivery_radii": []}',
  printer_settings JSONB NOT NULL DEFAULT '{"default_printer": "", "auto_print": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Criar índice para pesquisas por ID de usuário
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Criar políticas RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem ver suas próprias configurações"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias configurações"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualizar o timestamp
CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket para armazenar logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir acesso público para visualização dos logos
CREATE POLICY "Permitir acesso público para visualização dos logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company_logos');

-- Permitir que usuários autenticados façam upload de logos
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company_logos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Permitir que usuários autenticados atualizem seus próprios logos
CREATE POLICY "Usuários podem atualizar seus próprios logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company_logos' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Permitir que usuários autenticados removam seus próprios logos
CREATE POLICY "Usuários podem remover seus próprios logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company_logos' AND auth.uid() = (storage.foldername(name))[1]::uuid); 