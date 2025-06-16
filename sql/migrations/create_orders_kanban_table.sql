-- Criação da tabela para gerenciamento de pedidos no sistema Kanban
CREATE TABLE IF NOT EXISTS public.orders_kanban (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES public.customers(id),
  product_id TEXT NOT NULL, -- ID do produto solicitado
  product_name TEXT NOT NULL, -- Nome do produto (para exibição imediata sem join)
  seller_id uuid REFERENCES public.sellers(id),
  seller_name TEXT NOT NULL, -- Nome do vendedor (para exibição imediata sem join)
  status TEXT NOT NULL DEFAULT 'entrada', -- Status: entrada, preparando, saiu_para_entrega, cancelado, pendente
  notes TEXT, -- Observações adicionais
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Dono da loja
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_orders_kanban_owner_id ON public.orders_kanban(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_kanban_customer_id ON public.orders_kanban(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_kanban_status ON public.orders_kanban(status);

-- Trigger para atualizar o campo updated_at automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_orders_kanban'
  ) THEN
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_timestamp_orders_kanban
    BEFORE UPDATE ON public.orders_kanban
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.orders_kanban ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer um insira um pedido (cliente via frontend)
CREATE POLICY orders_kanban_insert_policy ON public.orders_kanban
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Política para que proprietários vejam apenas seus próprios pedidos
CREATE POLICY orders_kanban_select_owner_policy ON public.orders_kanban
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Política para vendedores verem pedidos da loja a que pertencem
CREATE POLICY orders_kanban_select_seller_policy ON public.orders_kanban
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers 
      WHERE sellers.id = auth.uid() 
      AND sellers.owner_id = orders_kanban.owner_id
    )
  );

-- Política para proprietários atualizarem seus próprios pedidos
CREATE POLICY orders_kanban_update_owner_policy ON public.orders_kanban
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Política para vendedores atualizarem pedidos da loja a que pertencem
CREATE POLICY orders_kanban_update_seller_policy ON public.orders_kanban
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers 
      WHERE sellers.id = auth.uid() 
      AND sellers.owner_id = orders_kanban.owner_id
    )
  ); 