-- Adiciona política para permitir que vendedores visualizem os produtos do proprietário
DROP POLICY IF EXISTS "Vendedores podem visualizar produtos do proprietário" ON products;

CREATE POLICY "Vendedores podem visualizar produtos do proprietário"
ON products
FOR SELECT
TO authenticated
USING (
  -- Verifica se o usuário atual é um vendedor
  EXISTS (
    SELECT 1 FROM sellers
    WHERE 
      sellers.auth_user_id = auth.uid() -- O ID do usuário atual é um vendedor
      AND 
      sellers.owner_id = products.owner_id -- O dono do vendedor é o mesmo dono do produto
      AND
      sellers.active = true -- Vendedor está ativo
  )
);
