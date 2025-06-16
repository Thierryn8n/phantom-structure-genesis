-- Script para reparar políticas duplicadas na tabela customers
-- Este script remove todas as políticas existentes e as recria corretamente

-- Primeiro, vamos remover todas as políticas existentes para a tabela customers
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'customers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON customers';
        RAISE NOTICE 'Política % removida da tabela customers', policy_record.policyname;
    END LOOP;
END $$;

-- Agora, vamos criar as políticas corretas
DO $$
BEGIN
    -- Política para inserção: só pode inserir se for dono
    CREATE POLICY customers_insert_policy ON customers 
        FOR INSERT 
        WITH CHECK (auth.uid() = owner_id);
    RAISE NOTICE 'Política customers_insert_policy criada';
    
    -- Política para seleção: só pode ver seus próprios clientes
    CREATE POLICY customers_select_policy ON customers 
        FOR SELECT 
        USING (auth.uid() = owner_id);
    RAISE NOTICE 'Política customers_select_policy criada';
    
    -- Política para atualização: só pode atualizar seus próprios clientes
    CREATE POLICY customers_update_policy ON customers 
        FOR UPDATE 
        USING (auth.uid() = owner_id);
    RAISE NOTICE 'Política customers_update_policy criada';
    
    -- Política para exclusão: só pode excluir seus próprios clientes
    CREATE POLICY customers_delete_policy ON customers 
        FOR DELETE 
        USING (auth.uid() = owner_id);
    RAISE NOTICE 'Política customers_delete_policy criada';
END $$;

-- Atualizar a função de busca para incluir o email
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

-- Confirma que todas as políticas foram criadas corretamente
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- Instruções de execução:
-- Este script pode ser executado com o comando:
-- psql -U seu_usuario -d seu_banco -f fix_customers_policy.sql
--
-- Ou no dashboard do Supabase, vá para:
-- SQL Editor > New Query > Cole este script e execute 