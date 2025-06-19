
-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID,
  image_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notas fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

-- Policies para products
CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para customers
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para fiscal_notes
CREATE POLICY "Users can view their own fiscal_notes" ON public.fiscal_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fiscal_notes" ON public.fiscal_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiscal_notes" ON public.fiscal_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fiscal_notes" ON public.fiscal_notes
  FOR DELETE USING (auth.uid() = user_id);
