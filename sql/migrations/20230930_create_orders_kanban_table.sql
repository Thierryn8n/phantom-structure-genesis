-- Create orders_kanban table
CREATE TABLE IF NOT EXISTS public.orders_kanban (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    customer_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    seller_id UUID NOT NULL, 
    seller_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('entrada', 'preparando', 'saiu_para_entrega', 'cancelado', 'pendente')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS (Row Level Security) Policies
ALTER TABLE public.orders_kanban ENABLE ROW LEVEL SECURITY;

-- Policy para leitura - Qualquer usuário autenticado pode ler todos os registros
CREATE POLICY orders_kanban_select_policy
    ON public.orders_kanban
    FOR SELECT
    USING (true);

-- Policy para inserção - Qualquer usuário autenticado pode inserir registros
CREATE POLICY orders_kanban_insert_policy
    ON public.orders_kanban
    FOR INSERT
    WITH CHECK (true);

-- Policy para atualização - Qualquer usuário autenticado pode atualizar registros
CREATE POLICY orders_kanban_update_policy
    ON public.orders_kanban
    FOR UPDATE
    USING (true);

-- Comentários de tabela e colunas
COMMENT ON TABLE public.orders_kanban IS 'Tabela para armazenar os pedidos no sistema Kanban';
COMMENT ON COLUMN public.orders_kanban.id IS 'ID único do pedido';
COMMENT ON COLUMN public.orders_kanban.product_id IS 'ID do produto';
COMMENT ON COLUMN public.orders_kanban.product_name IS 'Nome do produto para referência rápida';
COMMENT ON COLUMN public.orders_kanban.customer_id IS 'ID do cliente';
COMMENT ON COLUMN public.orders_kanban.customer_name IS 'Nome do cliente para referência rápida';
COMMENT ON COLUMN public.orders_kanban.seller_id IS 'ID do vendedor';
COMMENT ON COLUMN public.orders_kanban.seller_name IS 'Nome do vendedor para referência rápida';
COMMENT ON COLUMN public.orders_kanban.status IS 'Status do pedido: entrada, preparando, saiu_para_entrega, cancelado, pendente';
COMMENT ON COLUMN public.orders_kanban.notes IS 'Observações adicionais sobre o pedido';
COMMENT ON COLUMN public.orders_kanban.created_at IS 'Data e hora de criação do pedido';
COMMENT ON COLUMN public.orders_kanban.updated_at IS 'Data e hora da última atualização do pedido';

-- Garantir que o uuid-ossp extension está habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 