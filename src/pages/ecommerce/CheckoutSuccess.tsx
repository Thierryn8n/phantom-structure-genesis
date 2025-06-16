import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  // Limpa o carrinho quando o componente é montado
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pedido Realizado com Sucesso!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Obrigado por sua compra! Você receberá um e-mail com os detalhes do seu pedido.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/ecommerce')}
            className="bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white w-full"
          >
            Continuar Comprando
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/ecommerce/orders')}
            className="w-full"
          >
            Acompanhar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess; 