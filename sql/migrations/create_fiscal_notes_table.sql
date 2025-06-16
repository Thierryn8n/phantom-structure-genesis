-- Criar a tabela fiscal_notes
CREATE TABLE IF NOT EXISTS public.fiscal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_number TEXT NOT NULL,
    date DATE NOT NULL,
    products JSONB NOT NULL,
    customer_data JSONB NOT NULL,
    payment_data JSONB NOT NULL,
    total_value NUMERIC NOT NULL,
    status TEXT NOT NULL, -- e.g., 'draft', 'issued', 'printed', 'cancelled'
    seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
    seller_name TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS fiscal_notes_owner_id_idx ON public.fiscal_notes(owner_id);
CREATE INDEX IF NOT EXISTS fiscal_notes_note_number_idx ON public.fiscal_notes(note_number);
CREATE INDEX IF NOT EXISTS fiscal_notes_status_idx ON public.fiscal_notes(status);
CREATE INDEX IF NOT EXISTS fiscal_notes_seller_id_idx ON public.fiscal_notes(seller_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

-- Política para inserção: só pode inserir se for dono
CREATE POLICY fiscal_notes_insert_policy ON public.fiscal_notes
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Política para seleção: só pode ver suas próprias notas
CREATE POLICY fiscal_notes_select_policy ON public.fiscal_notes
    FOR SELECT
    USING (auth.uid() = owner_id);

-- Política para atualização: só pode atualizar suas próprias notas
CREATE POLICY fiscal_notes_update_policy ON public.fiscal_notes
    FOR UPDATE
    USING (auth.uid() = owner_id);

-- Política para exclusão: só pode excluir suas próprias notas
CREATE POLICY fiscal_notes_delete_policy ON public.fiscal_notes
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Comentários nas colunas (opcional, mas bom para documentação)
COMMENT ON COLUMN public.fiscal_notes.status IS 'Status da nota: draft, issued, printed, cancelled etc.';
COMMENT ON COLUMN public.fiscal_notes.products IS 'Array de objetos de produtos da nota';
COMMENT ON COLUMN public.fiscal_notes.customer_data IS 'Objeto com dados do cliente da nota';
COMMENT ON COLUMN public.fiscal_notes.payment_data IS 'Objeto com dados de pagamento da nota'; 