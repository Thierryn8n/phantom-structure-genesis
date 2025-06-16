-- Script para diagnosticar problemas no banco de dados do Fiscal Flow
-- Execute este script no SQL Editor do Supabase para verificar as tabelas

-- Verificar se as tabelas necessárias existem
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fiscal_notes'
) AS fiscal_notes_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customers'
) AS customers_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sellers'
) AS sellers_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
) AS products_exists;

-- Listar colunas da tabela fiscal_notes (se existir)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'fiscal_notes'
ORDER BY ordinal_position;

-- Listar colunas da tabela customers (se existir)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Verificar políticas RLS (Row Level Security)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename = 'fiscal_notes' OR tablename = 'customers')
ORDER BY tablename, policyname;

-- Verificar funções RPC
SELECT 
    n.nspname as schema,
    p.proname as name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proname = 'search_customers' OR p.proname = 'mark_note_as_printed')
ORDER BY p.proname; 