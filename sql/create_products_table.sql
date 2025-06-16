-- Criação da tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  image_path VARCHAR(255),
  imageUrl VARCHAR(255),
  ncm VARCHAR(20),
  unit VARCHAR(10),
  quantity NUMERIC(10,2),
  total NUMERIC(10,2),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para busca por nome e código
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_code ON products (code);
CREATE INDEX idx_products_ncm ON products (ncm);

-- Adicionar política de segurança baseada em linha (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem apenas seus próprios produtos
CREATE POLICY "Usuários só podem gerenciar seus próprios produtos"
ON products
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Função para calcular o valor total (preço * quantidade) ao inserir ou atualizar
CREATE OR REPLACE FUNCTION calculate_product_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
    NEW.total := NEW.price * NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular o total automaticamente
CREATE TRIGGER set_product_total
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION calculate_product_total();

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
