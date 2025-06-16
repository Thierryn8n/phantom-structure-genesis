-- Criação da tabela customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address JSONB DEFAULT '{}'::jsonb, -- Armazena o endereço como JSON (rua, número, bairro, cidade, estado, CEP)
  signature TEXT, -- Base64 da assinatura (opcional)
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários na tabela e colunas
COMMENT ON TABLE public.customers IS 'Clientes cadastrados no sistema';
COMMENT ON COLUMN public.customers.id IS 'Identificador único do cliente';
COMMENT ON COLUMN public.customers.name IS 'Nome completo do cliente';
COMMENT ON COLUMN public.customers.phone IS 'Telefone do cliente';
COMMENT ON COLUMN public.customers.email IS 'Email do cliente';
COMMENT ON COLUMN public.customers.address IS 'Endereço do cliente em formato JSON';
COMMENT ON COLUMN public.customers.signature IS 'Assinatura do cliente em formato Base64';
COMMENT ON COLUMN public.customers.owner_id IS 'ID do proprietário da conta';
COMMENT ON COLUMN public.customers.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.customers.updated_at IS 'Data da última atualização';

-- Índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Trigger para atualizar o campo updated_at automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_customers'
  ) THEN
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_timestamp_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Verifica e cria as políticas apenas se não existirem
DO $$ 
BEGIN
  -- Política para proprietários verem apenas seus próprios clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'owner_select_policy'
  ) THEN
    CREATE POLICY owner_select_policy ON public.customers 
      FOR SELECT USING (auth.uid() = owner_id);
  END IF;

  -- Política para vendedores verem clientes do proprietário
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'seller_select_policy'
  ) THEN
    CREATE POLICY seller_select_policy ON public.customers 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.sellers 
          WHERE sellers.id = auth.uid() 
          AND sellers.owner_id = customers.owner_id
        )
      );
  END IF;

  -- Política para proprietários inserirem clientes
  /* -- COMENTADO: Esta política é muito restritiva para o cadastro público de clientes no e-commerce.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'owner_insert_policy'
  ) THEN
    CREATE POLICY owner_insert_policy ON public.customers 
      FOR INSERT WITH CHECK (auth.uid() = owner_id);
  END IF;
  */

  -- Política para vendedores inserirem clientes do proprietário
  /* -- COMENTADO: Esta política também não se aplica ao cadastro público de clientes no e-commerce.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'seller_insert_policy'
  ) THEN
    CREATE POLICY seller_insert_policy ON public.customers 
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.sellers 
          WHERE sellers.id = auth.uid() 
          AND NEW.owner_id IN (
            SELECT owner_id FROM public.sellers WHERE id = auth.uid()
          )
        )
      );
  END IF;
  */

  -- NOVA POLÍTICA: Permitir que usuários autenticados ou anônimos registrem clientes para uma loja.
  -- A segurança de que o 'owner_id' correto (da loja) é usado depende do frontend.
  -- A chave estrangeira em 'owner_id' para 'auth.users' já garante que seja um usuário válido.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'allow_customer_registration_for_store'
  ) THEN
    CREATE POLICY allow_customer_registration_for_store ON public.customers
      FOR INSERT
      TO authenticated, anon -- Permite para usuários logados e visitantes anônimos
      WITH CHECK (true); -- Não adiciona restrições extras na linha sendo inserida por esta política,
                        -- além das permissões básicas de INSERT e constraints da tabela.
  END IF;

  -- Política para proprietários atualizarem seus próprios clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'owner_update_policy'
  ) THEN
    CREATE POLICY owner_update_policy ON public.customers 
      FOR UPDATE USING (auth.uid() = owner_id);
  END IF;

  -- Política para vendedores atualizarem clientes do proprietário
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'seller_update_policy'
  ) THEN
    CREATE POLICY seller_update_policy ON public.customers 
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.sellers 
          WHERE sellers.id = auth.uid() 
          AND sellers.owner_id = customers.owner_id
        )
      );
  END IF;

  -- Política para proprietários excluírem seus próprios clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'owner_delete_policy'
  ) THEN
    CREATE POLICY owner_delete_policy ON public.customers 
      FOR DELETE USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Função para buscar clientes por termo de pesquisa
CREATE OR REPLACE FUNCTION public.search_customers(
  p_owner_id UUID,
  p_search_term TEXT DEFAULT NULL
) 
RETURNS SETOF public.customers AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.customers
  WHERE owner_id = p_owner_id
    AND (
      p_search_term IS NULL 
      OR name ILIKE '%' || p_search_term || '%'
      OR phone ILIKE '%' || p_search_term || '%'
      OR email ILIKE '%' || p_search_term || '%'
      OR address->>'city' ILIKE '%' || p_search_term || '%'
    )
  ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 