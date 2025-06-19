
-- Corrigir estrutura da tabela de produtos se necessário
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
