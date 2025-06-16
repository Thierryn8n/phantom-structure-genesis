-- Certifique-se de que a extensão uuid-ossp está habilitada,
-- o Supabase geralmente a tem, mas é uma boa prática incluir.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para armazenar avaliações de produtos
CREATE TABLE public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    user_id UUID, -- Pode ser nulo se a avaliação for anônima
    author_name TEXT, -- Para nome exibido (útil para anônimos ou se diferente do perfil)
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Nota de 1 a 5 estrelas
    comment TEXT, -- O texto da avaliação
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_product
        FOREIGN KEY(product_id) 
        REFERENCES public.products(id) -- Certifique-se que 'public.products' é sua tabela de produtos
        ON DELETE CASCADE, -- Se um produto for deletado, suas avaliações também serão

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES auth.users(id) -- Tabela de usuários padrão do Supabase Auth
        ON DELETE SET NULL -- Se o usuário for deletado, mantém a avaliação, mas desvincula o user_id
);

-- Comentários para a tabela e colunas
COMMENT ON TABLE public.product_reviews IS 'Armazena avaliações e notas de clientes para os produtos.';
COMMENT ON COLUMN public.product_reviews.product_id IS 'Chave estrangeira para o produto que está sendo avaliado.';
COMMENT ON COLUMN public.product_reviews.user_id IS 'Chave estrangeira para o usuário que enviou a avaliação (se autenticado).';
COMMENT ON COLUMN public.product_reviews.author_name IS 'Nome de exibição do avaliador (pode ser diferente do perfil do usuário ou para avaliações anônimas).';
COMMENT ON COLUMN public.product_reviews.rating IS 'Nota em estrelas, de 1 a 5.';
COMMENT ON COLUMN public.product_reviews.comment IS 'Conteúdo textual da avaliação.';

-- Índices para otimizar buscas
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);

-- Função para atualizar 'updated_at' automaticamente em cada update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para chamar a função acima antes de qualquer update na tabela product_reviews
CREATE TRIGGER trigger_update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS) para a tabela
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas:
-- 1. Permitir que todos leiam as avaliações (público)
CREATE POLICY "Allow public read access to reviews"
ON public.product_reviews
FOR SELECT
USING (true);

-- 2. Permitir que usuários autenticados insiram novas avaliações
--    Aqui, user_id e author_name seriam preenchidos pela sua aplicação.
--    Se user_id for preenchido, deve corresponder ao UID do usuário autenticado.
CREATE POLICY "Allow authenticated users to insert reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (true); -- Você pode refinar esta condição, por exemplo: (user_id IS NULL OR auth.uid() = user_id)

-- 3. Permitir que usuários autenticados atualizem SUAS PRÓPRIAS avaliações
CREATE POLICY "Allow users to update their own reviews"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Permitir que usuários autenticados deletem SUAS PRÓPRIAS avaliações
CREATE POLICY "Allow users to delete their own reviews"
ON public.product_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 