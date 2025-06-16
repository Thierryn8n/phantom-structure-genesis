-- Script para verificar detalhes da coluna owner_id na tabela products

-- Verificar se a coluna owner_id existe e seu tipo de dados
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'products'
  AND column_name = 'owner_id';

-- Verificar se há restrições na coluna owner_id
SELECT 
  tc.constraint_name, 
  tc.constraint_type, 
  kcu.column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.table_schema = 'public' 
  AND tc.table_name = 'products'
  AND kcu.column_name = 'owner_id';

-- Verificar se há índices na coluna owner_id
SELECT
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  schemaname = 'public'
  AND tablename = 'products'
  AND indexdef LIKE '%owner_id%';

-- Verificar amostra de dados (10 primeiros registros) para verificar o formato dos valores em owner_id
SELECT 
  id, 
  owner_id, 
  name
FROM 
  products
LIMIT 10;

-- Verificar contagem de produtos por usuário para confirmar se os dados estão agrupados corretamente
SELECT 
  owner_id, 
  COUNT(*) as count
FROM 
  products
GROUP BY 
  owner_id;

-- Verificar se há algum owner_id nulo
SELECT 
  COUNT(*) as null_owner_ids
FROM 
  products
WHERE 
  owner_id IS NULL; 