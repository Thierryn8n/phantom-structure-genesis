import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { formatPrice } from '@/utils/format';

const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateCartItemQuantity } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Carrinho de Compras</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-4">Adicione alguns produtos para continuar comprando</p>
          <Button 
            onClick={() => navigate('/ecommerce')}
            className="bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white"
          >
            Continuar Comprando
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {cartItems.map((item) => (
                <div key={item.id} className="p-4 border-b last:border-b-0">
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Código: {item.id}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-1 border-x">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-lg border-t pt-4">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/ecommerce/checkout')}
                className="w-full mt-6 bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white"
              >
                Finalizar Compra
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/ecommerce')}
                className="w-full mt-2"
              >
                Continuar Comprando
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart; 