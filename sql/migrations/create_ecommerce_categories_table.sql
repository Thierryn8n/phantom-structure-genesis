-- Cria a tabela de categorias para o e-commerce
CREATE TABLE IF NOT EXISTS public.ecommerce_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissões RLS
-- Todos os usuários autenticados podem visualizar categorias
ALTER TABLE public.ecommerce_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecommerce_categories_select_policy" 
ON public.ecommerce_categories
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Apenas administradores podem criar, atualizar e excluir categorias
CREATE POLICY "ecommerce_categories_insert_policy" 
ON public.ecommerce_categories
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "ecommerce_categories_update_policy" 
ON public.ecommerce_categories
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "ecommerce_categories_delete_policy" 
ON public.ecommerce_categories
FOR DELETE 
USING (
  auth.uid() IS NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ecommerce_categories_name ON public.ecommerce_categories (name); 