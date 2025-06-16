-- Consulta para verificar a estrutura da tabela products
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'products'
ORDER BY 
  ordinal_position;

-- Verificar se os campos user_id e owner_id existem na tabela
SELECT 
  COUNT(*) AS count_user_id
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'products'
  AND column_name = 'user_id';

SELECT 
  COUNT(*) AS count_owner_id
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'products'
  AND column_name = 'owner_id';

-- Verificar as políticas RLS (Row Level Security) da tabela products
SELECT 
  polname, 
  polcmd, 
  polpermissive, 
  polroles,
  polqual
FROM 
  pg_policy
WHERE 
  polrelid = 'public.products'::regclass; 