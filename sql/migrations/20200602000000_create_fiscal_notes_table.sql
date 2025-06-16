-- Criação da tabela fiscal_notes
CREATE TABLE IF NOT EXISTS public.fiscal_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_number TEXT NOT NULL,
  date TEXT NOT NULL, -- Data no formato string para facilitar manipulação
  products JSONB NOT NULL, -- Array de produtos em formato JSON
  customer_data JSONB NOT NULL, -- Dados do cliente em formato JSON
  payment_data JSONB NOT NULL, -- Dados de pagamento em formato JSON
  total_value NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'printed', 'canceled', 'finalized')),
  seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  seller_name TEXT,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  printed_at TIMESTAMP WITH TIME ZONE
);

-- Comentários na tabela e colunas
COMMENT ON TABLE public.fiscal_notes IS 'Notas fiscais e orçamentos emitidos';
COMMENT ON COLUMN public.fiscal_notes.id IS 'Identificador único da nota';
COMMENT ON COLUMN public.fiscal_notes.note_number IS 'Número da nota gerado pelo sistema';
COMMENT ON COLUMN public.fiscal_notes.date IS 'Data de emissão da nota';
COMMENT ON COLUMN public.fiscal_notes.products IS 'Lista de produtos incluídos na nota';
COMMENT ON COLUMN public.fiscal_notes.customer_data IS 'Dados do cliente';
COMMENT ON COLUMN public.fiscal_notes.payment_data IS 'Informações de pagamento';
COMMENT ON COLUMN public.fiscal_notes.total_value IS 'Valor total da nota';
COMMENT ON COLUMN public.fiscal_notes.status IS 'Status atual da nota (rascunho, emitida, impressa, cancelada, finalizada)';
COMMENT ON COLUMN public.fiscal_notes.seller_id IS 'Referência ao vendedor que emitiu a nota';
COMMENT ON COLUMN public.fiscal_notes.seller_name IS 'Nome do vendedor (para persistência histórica)';
COMMENT ON COLUMN public.fiscal_notes.owner_id IS 'Proprietário da conta/empresa';
COMMENT ON COLUMN public.fiscal_notes.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.fiscal_notes.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN public.fiscal_notes.printed_at IS 'Data da última impressão';

-- Índices para melhorar o desempenho das consultas
CREATE INDEX idx_fiscal_notes_owner_id ON public.fiscal_notes(owner_id);
CREATE INDEX idx_fiscal_notes_seller_id ON public.fiscal_notes(seller_id);
CREATE INDEX idx_fiscal_notes_status ON public.fiscal_notes(status);
CREATE INDEX idx_fiscal_notes_date ON public.fiscal_notes(date);
CREATE INDEX idx_fiscal_notes_total_value ON public.fiscal_notes(total_value);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.fiscal_notes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Atualizar configuração de RLS (Row Level Security)
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

-- Política para proprietários verem todas as notas da sua empresa/conta
CREATE POLICY owner_select_policy ON public.fiscal_notes 
  FOR SELECT USING (auth.uid() = owner_id);

-- Política para vendedores verem apenas suas próprias notas
CREATE POLICY seller_select_policy ON public.fiscal_notes 
  FOR SELECT USING (
    auth.uid() <> owner_id AND 
    auth.uid()::text = seller_id::text
  );

-- Política para proprietários inserirem notas
CREATE POLICY owner_insert_policy ON public.fiscal_notes 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para vendedores inserirem notas (apenas se eles forem o vendedor da nota)
CREATE POLICY seller_insert_policy ON public.fiscal_notes 
  FOR INSERT WITH CHECK (
    auth.uid() <> owner_id AND
    auth.uid()::text = seller_id::text
  );

-- Política para proprietários atualizarem notas
CREATE POLICY owner_update_policy ON public.fiscal_notes 
  FOR UPDATE USING (auth.uid() = owner_id);

-- Política para vendedores atualizarem suas próprias notas
CREATE POLICY seller_update_policy ON public.fiscal_notes 
  FOR UPDATE USING (
    auth.uid() <> owner_id AND
    auth.uid()::text = seller_id::text AND
    status = 'draft'
  );

-- Política para proprietários excluírem notas
CREATE POLICY owner_delete_policy ON public.fiscal_notes 
  FOR DELETE USING (auth.uid() = owner_id AND status = 'draft');

-- Política para vendedores excluírem suas próprias notas em rascunho
CREATE POLICY seller_delete_policy ON public.fiscal_notes 
  FOR DELETE USING (
    auth.uid() <> owner_id AND
    auth.uid()::text = seller_id::text AND
    status = 'draft'
  );

-- Função para marcar nota como impressa
CREATE OR REPLACE FUNCTION public.mark_note_as_printed(p_note_id UUID, p_owner_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  UPDATE public.fiscal_notes
  SET 
    status = 'printed',
    printed_at = NOW(),
    updated_at = NOW()
  WHERE 
    id = p_note_id AND 
    owner_id = p_owner_id;
    
  GET DIAGNOSTICS v_result = ROW_COUNT;
  RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de notas por período
CREATE OR REPLACE FUNCTION public.get_notes_stats(
  p_owner_id UUID,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL,
  p_seller_id UUID DEFAULT NULL
) 
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'totalCount', COUNT(*),
      'totalValue', COALESCE(SUM(total_value), 0),
      'byStatus', jsonb_object_agg(status, status_count),
      'bySeller', CASE WHEN sellers_data IS NULL THEN '{}'::JSONB ELSE sellers_data END,
      'byPaymentMethod', payment_methods_data
    ) INTO v_result
  FROM (
    -- Contagem por status
    SELECT 
      status, 
      COUNT(*) AS status_count
    FROM public.fiscal_notes
    WHERE 
      owner_id = p_owner_id AND
      (p_start_date IS NULL OR date >= p_start_date) AND
      (p_end_date IS NULL OR date <= p_end_date) AND
      (p_seller_id IS NULL OR seller_id = p_seller_id)
    GROUP BY status
  ) status_stats,
  LATERAL (
    -- Dados agregados por vendedor
    SELECT 
      jsonb_object_agg(
        seller_id::text, 
        jsonb_build_object(
          'count', COUNT(*),
          'value', COALESCE(SUM(total_value), 0)
        )
      ) AS sellers_data
    FROM public.fiscal_notes
    WHERE 
      owner_id = p_owner_id AND
      seller_id IS NOT NULL AND
      (p_start_date IS NULL OR date >= p_start_date) AND
      (p_end_date IS NULL OR date <= p_end_date) AND
      (p_seller_id IS NULL OR seller_id = p_seller_id)
    GROUP BY seller_id
  ) seller_stats,
  LATERAL (
    -- Dados agregados por método de pagamento
    SELECT 
      jsonb_object_agg(
        payment_method, 
        jsonb_build_object(
          'count', COUNT(*),
          'value', COALESCE(SUM(total_value), 0)
        )
      ) AS payment_methods_data
    FROM (
      SELECT 
        total_value,
        payment_data->>'method' AS payment_method
      FROM public.fiscal_notes
      WHERE 
        owner_id = p_owner_id AND
        (p_start_date IS NULL OR date >= p_start_date) AND
        (p_end_date IS NULL OR date <= p_end_date) AND
        (p_seller_id IS NULL OR seller_id = p_seller_id)
    ) payment_data
    GROUP BY payment_method
  ) payment_stats;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 