import React, { useState, useEffect } from 'react';
import StoreLayout from '@/components/ecommerce/StoreLayout';
import { 
  ShoppingCart, 
  Trash, 
  Heart, 
  ShoppingBag, 
  ArrowLeft,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, EcommerceProduct } from '@/services/ecommerceService';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<EcommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  // Carregar itens da lista de desejos
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoading(true);
      try {
        // Em um cenário real, isso viria de uma API ou localStorage
        // Para este exemplo, vamos usar produtos do serviço de e-commerce
        const { data } = await EcommerceService.getProducts(1, 4);
        
        // Simula uma lista de desejos com os primeiros produtos
        setWishlistItems(data);
      } catch (error) {
        console.error('Erro ao carregar lista de desejos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar sua lista de desejos.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWishlist();
  }, [toast]);

  // Adicionar produto ao carrinho
  const handleAddToCart = (product: EcommerceProduct) => {
    addToCart(product, 1);
    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };

  // Remover produto da lista de desejos
  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
    toast({
      title: 'Produto removido',
      description: 'Item removido da sua lista de desejos',
    });
  };

  // Ver detalhes do produto
  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost"
            className="mr-2"
            onClick={() => navigate('/ecommerce')}
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Minha Lista de Desejos</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <Skeleton className="w-full h-48 mb-4" />
                <Skeleton className="w-3/4 h-6 mb-2" />
                <Skeleton className="w-1/2 h-5 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="w-1/2 h-10" />
                  <Skeleton className="w-1/2 h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-medium mb-2">Sua lista de desejos está vazia</h2>
            <p className="text-gray-500 mb-6">
              Navegue pela loja e adicione itens à sua lista de desejos clicando no ícone de coração.
            </p>
            <Button 
              onClick={() => navigate('/ecommerce')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden group"
                >
                  <div 
                    className="relative h-48 bg-gray-100 cursor-pointer"
                    onClick={() => handleViewProduct(item.id)}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ShoppingBag size={32} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Badge de categoria */}
                    {item.category && (
                      <span className="absolute top-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                        {item.category}
                      </span>
                    )}
                    
                    {/* Botão para remover da lista de desejos */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWishlist(item.id);
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-100 transition-colors"
                    >
                      <Trash size={16} className="text-red-500" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 
                      className="font-medium mb-1 hover:text-yellow-500 cursor-pointer line-clamp-2"
                      onClick={() => handleViewProduct(item.id)}
                    >
                      {item.name}
                    </h3>
                    
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={`${star <= 4 ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="text-gray-500 text-xs ml-1">(24)</span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-lg font-bold text-black">
                        {formatPrice(item.price)}
                      </p>
                      {Math.random() > 0.5 && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(item.price * 1.2)}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full bg-black hover:bg-yellow-500 text-white"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart size={16} className="mr-2" />
                      Adicionar ao carrinho
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Button
                onClick={() => navigate('/ecommerce')}
                variant="outline"
                className="bg-white border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white px-8"
              >
                Continuar comprando
              </Button>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
};

export default Wishlist; 