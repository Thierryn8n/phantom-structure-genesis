import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { 
  ShoppingCart, 
  ShoppingBag, 
  X, 
  Trash, 
  Plus, 
  Minus, 
  ChevronRight, 
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ShoppingCartProps {
  className?: string;
}

const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({ className }) => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    totalItems, 
    totalPrice, 
    isCartOpen, 
    setIsCartOpen 
  } = useCart();

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalPrice);

  if (!isCartOpen) {
    return (
      <div 
        className="fixed right-4 bottom-4 z-40 text-white p-3 rounded-full shadow-lg cursor-pointer transition-all"
        style={{
          backgroundColor: 'var(--store-primary, #2563eb)',
          color: 'var(--store-primary-foreground, white)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover, #1d4ed8)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary, #2563eb)'}
        onClick={() => setIsCartOpen(true)}
      >
        <div className="relative">
          <ShoppingBag size={24} />
          {totalItems > 0 && (
            <span 
              className="absolute -top-2 -right-2 text-xs rounded-full h-5 w-5 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--store-accent, #f59e0b)',
                color: 'var(--store-accent-foreground, black)'
              }}
            >
              {totalItems}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div 
        className={`bg-white w-full max-w-md h-full flex flex-col shadow-xl transform transition-transform ${className}`}
      >
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            backgroundColor: 'var(--store-primary, #2563eb)',
            color: 'var(--store-primary-foreground, white)',
            borderColor: 'var(--store-primary-hover, #1d4ed8)'
          }}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: 'inherit' }} />
            Carrinho
            {totalItems > 0 && (
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: 'var(--store-accent, #f59e0b)',
                  color: 'var(--store-accent-foreground, black)'
                }}
              >
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            )}
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full"
            style={{ color: 'inherit' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover, #1d4ed8)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag size={64} className="text-gray-300 mb-4" />
              <p className="mb-2">Seu carrinho está vazio</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="font-medium"
                style={{ color: 'var(--store-primary, #2563eb)' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--store-primary-hover, #1d4ed8)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--store-primary, #2563eb)'}
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div 
                  key={item.id}
                  className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        aria-label="Remover item"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.price)}
                      {item.unit && ` / ${item.unit}`}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border rounded-md overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} className={item.quantity <= 1 ? "text-gray-300" : "text-gray-600"} />
                        </button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-100"
                        >
                          <Plus size={14} className="text-gray-600" />
                        </button>
                      </div>
                      
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formattedTotal}</span>
            </div>
            
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-xl text-fiscal-green-700">{formattedTotal}</span>
            </div>
            
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/checkout"
                className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: 'var(--store-primary, #2563eb)',
                  color: 'var(--store-primary-foreground, white)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover, #1d4ed8)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary, #2563eb)'}
                onClick={() => setIsCartOpen(false)}
              >
                Finalizar compra
                <ChevronRight size={18} />
              </Link>
              
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--store-secondary, #4b5563)',
                  borderColor: 'var(--store-secondary, #d1d5db)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--store-secondary, #d1d5db)';
                  e.currentTarget.style.color = 'var(--store-secondary-foreground, white)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--store-secondary, #4b5563)';
                }}
              >
                Continuar comprando
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
              <CheckCircle size={14} style={{ color: 'var(--store-primary)' }} />
              Frete grátis para compras acima de R$ 100,00
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCartComponent; 