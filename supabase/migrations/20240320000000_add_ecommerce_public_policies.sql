-- Habilitar RLS nas tabelas do e-commerce
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Garantir que as colunas necessárias existam
DO $$ 
BEGIN
  -- Verificar se a tabela orders_kanban existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders_kanban'
  ) THEN
    -- Adicionar coluna owner_id na tabela orders_kanban se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders_kanban' AND column_name = 'owner_id') 
    THEN
      ALTER TABLE public.orders_kanban ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
  END IF;

  -- Verificar se a tabela customers existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    -- Adicionar coluna owner_id na tabela customers se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'owner_id') 
    THEN
      ALTER TABLE public.customers ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
  END IF;
END $$;

-- Garantir acesso público completo para visualização de produtos
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.products;
CREATE POLICY "Permitir leitura pública de produtos"
  ON public.products 
  FOR SELECT 
  TO public
  USING (true);

-- Garantir acesso público para categorias
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON public.ecommerce_categories;
CREATE POLICY "Permitir leitura pública de categorias"
  ON public.ecommerce_categories
  FOR SELECT 
  TO public
  USING (true);

-- Garantir acesso público para configurações
DROP POLICY IF EXISTS "Permitir leitura pública de configurações" ON public.ecommerce_settings;
CREATE POLICY "Permitir leitura pública de configurações"
  ON public.ecommerce_settings
  FOR SELECT 
  TO public
  USING (true);

-- Políticas para pedidos (orders_kanban)
DROP POLICY IF EXISTS "Permitir criação de pedidos sem autenticação" ON public.orders_kanban;
DROP POLICY IF EXISTS "Permitir leitura pública de pedidos" ON public.orders_kanban;
DROP POLICY IF EXISTS "Permitir leitura de pedidos sem autenticação" ON public.orders_kanban;

CREATE POLICY "Permitir criação de pedidos sem autenticação"
  ON public.orders_kanban 
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de pedidos sem autenticação"
  ON public.orders_kanban 
  FOR SELECT 
  TO public
  USING (true);

-- Políticas para clientes
DROP POLICY IF EXISTS "Permitir criação de clientes sem autenticação" ON public.customers;
DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.customers;
DROP POLICY IF EXISTS "Permitir leitura de clientes sem autenticação" ON public.customers;

CREATE POLICY "Permitir criação de clientes sem autenticação"
  ON public.customers 
  FOR INSERT 
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de clientes sem autenticação"
  ON public.customers 
  FOR SELECT 
  TO public
  USING (true);

-- Políticas para avaliações de produtos
DROP POLICY IF EXISTS "Permitir leitura pública de avaliações" ON public.product_reviews;
CREATE POLICY "Permitir leitura pública de avaliações"
  ON public.product_reviews 
  FOR SELECT 
  TO public
  USING (true);

DROP POLICY IF EXISTS "Qualquer pessoa pode adicionar avaliações" ON public.product_reviews;
CREATE POLICY "Qualquer pessoa pode adicionar avaliações"
  ON public.product_reviews 
  FOR INSERT 
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias avaliações" ON public.product_reviews;
CREATE POLICY "Usuários podem gerenciar suas próprias avaliações"
  ON public.product_reviews 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para melhor performance (só criar se as colunas existirem)
DO $$
BEGIN
  -- Verificar se a coluna owner_id existe em orders_kanban
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders_kanban' AND column_name = 'owner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_orders_kanban_public ON public.orders_kanban(owner_id, status, created_at);
  END IF;

  -- Verificar se a coluna owner_id existe em customers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'owner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_customers_public ON public.customers(owner_id, phone);
  END IF;
END $$;

-- Criar índice para product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_public ON public.product_reviews(product_id);

-- Garantir que o papel anônimo (public) tenha acesso às tabelas
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Garantir permissões específicas para tabelas críticas
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.ecommerce_categories TO anon;
GRANT SELECT ON public.ecommerce_settings TO anon;
GRANT SELECT, INSERT ON public.orders_kanban TO anon;
GRANT SELECT, INSERT ON public.customers TO anon;
GRANT SELECT, INSERT ON public.product_reviews TO anon; 