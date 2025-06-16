-- Script para testar consultas simples à tabela products

-- Testar uma consulta básica para verificar estrutura
SELECT 
  COUNT(*) as total_products 
FROM 
  products;

-- Testar consulta sem RLS (usando autenticação de serviço)
-- Esta consulta deve ser executada através do painel SQL do Supabase com autenticação de serviço

-- Verificar os nomes reais das colunas na tabela products
SELECT 
  column_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'products'
ORDER BY 
  ordinal_position;

-- Fazer consulta com cada uma destas variações de sintaxe para ver qual funciona
-- Variação 1: count(*) sem parênteses na função
SELECT 
  count(*) 
FROM 
  products;

-- Variação 2: COUNT(*) com todas as letras maiúsculas
SELECT 
  COUNT(*) 
FROM 
  products;

-- Variação 3: count(1) usando um valor constante
SELECT 
  count(1) 
FROM 
  products;

-- Variação 4: count(id) contando uma coluna específica
SELECT 
  count(id) 
FROM 
  products;

-- Testar consulta sem o parâmetro select=count(*)
-- Esta consulta deve ser equivalente à que está falhando no código
SELECT 
  * 
FROM 
  products
WHERE 
  owner_id = '8cf8e3c5-492d-45f9-974c-f8a24209cb86'
LIMIT 1; 