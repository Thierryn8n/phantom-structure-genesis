-- Criar a tabela customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address JSONB,
    signature TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS customers_owner_id_idx ON customers(owner_id);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);

-- Habilitar RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Verifica se a política já existe antes de criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'customers_insert_policy'
    ) THEN
        -- Política para inserção: só pode inserir se for dono
        CREATE POLICY customers_insert_policy ON customers 
            FOR INSERT 
            WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'customers_select_policy'
    ) THEN
        -- Política para seleção: só pode ver seus próprios clientes
        CREATE POLICY customers_select_policy ON customers 
            FOR SELECT 
            USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'customers_update_policy'
    ) THEN
        -- Política para atualização: só pode atualizar seus próprios clientes
        CREATE POLICY customers_update_policy ON customers 
            FOR UPDATE 
            USING (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'customers_delete_policy'
    ) THEN
        -- Política para exclusão: só pode excluir seus próprios clientes
        CREATE POLICY customers_delete_policy ON customers 
            FOR DELETE 
            USING (auth.uid() = owner_id);
    END IF;
END $$;

-- Função RPC para busca de clientes
-- Verifica se a função já existe e a substitui (ou cria, se não existir)
CREATE OR REPLACE FUNCTION search_customers(
    p_owner_id UUID,
    p_search_term TEXT
) RETURNS SETOF customers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM customers
    WHERE owner_id = p_owner_id
    AND (
        name ILIKE '%' || p_search_term || '%' OR
        phone ILIKE '%' || p_search_term || '%' OR
        email ILIKE '%' || p_search_term || '%'
    )
    ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 