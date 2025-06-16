import React, { useState, useEffect } from 'react';
import StoreLayout from '@/components/ecommerce/StoreLayout';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Tag, 
  ShoppingBag, 
  ChevronRight, 
  ArrowUpRight,
  Star,
  Eye,
  ShoppingCart,
  Truck,
  CreditCard,
  RefreshCw,
  Check,
  User,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EcommerceService, EcommerceProduct, StoreInfo } from '@/services/ecommerceService';
import { useCart } from '@/contexts/CartContext';
import ShoppingCartComponent from '@/components/ecommerce/ShoppingCart';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const Ecommerce: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, isCartOpen } = useCart();
  
  // Estados
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EcommerceProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(12);
  const [refreshKey, setRefreshKey] = useState(0); // Para forçar atualizações

  // Verificar se estamos em modo preview
  const isPreviewMode = window.location.search.includes('preview=true');

  // Função para limpar o cache e recarregar
  const handleReloadStore = () => {
    localStorage.removeItem('fiscal_flow_store_info');
    toast({
      title: 'Cache limpo',
      description: 'Recarregando informações da loja...'
    });
    
    // Nova implementação com forceRefresh
    setIsLoading(true);
    EcommerceService.getStoreInfo(true)
      .then(storeInfo => {
        setStoreInfo(storeInfo);
        toast({
          title: 'Concluído',
          description: 'Informações da loja atualizadas com sucesso.'
        });
      })
      .catch(error => {
        console.error('Erro ao recarregar dados da loja:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar as informações da loja.',
          variant: 'destructive'
        });
      })
      .finally(() => setIsLoading(false));
  };

  // Função para fazer login com email e senha fixos (solução temporária)
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@exemplo.com',
        password: 'senha123'
      });
      
      if (error) {
        console.error('Erro de login:', error);
        toast({
          title: 'Erro de autenticação',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Login realizado',
        description: 'Usuário autenticado com sucesso'
      });
      
      // Recarregar dados após o login
      loadStoreData();
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar um novo usuário (solução temporária)
  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@exemplo.com',
        password: 'senha123',
        options: {
          data: {
            name: 'Admin Teste',
            role: 'admin'
          }
        }
      });
      
      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast({
          title: 'Erro ao criar usuário',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Usuário criado',
        description: 'Verifique o e-mail para confirmar a conta'
      });
      
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar o status da autenticação
  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao verificar autenticação:', error);
        toast({
          title: 'Não autenticado',
          description: 'Usuário não está logado: ' + error.message,
          variant: 'destructive'
        });
        return;
      }
      
      if (data.user) {
        console.log('Usuário autenticado:', data.user);
        toast({
          title: 'Autenticado',
          description: `Logado como: ${data.user.email}`,
        });
      } else {
        toast({
          title: 'Não autenticado',
          description: 'Nenhum usuário logado',
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  // Carregar produtos e informações da loja
  const loadStoreData = async () => {
    setIsLoading(true);
    
    try {
      // Definir as informações da loja padrão (fallback)
      const defaultStoreInfo: StoreInfo = {
        name: 'Loja Online',
        description: 'Bem-vindo à nossa loja online',
        banner_image_url: 'https://demo-toolpart.myshopify.com/cdn/shop/files/slider-bg_3b2cf8cb-3b36-40eb-ba09-c4e93aa9e01d.jpg?v=1710403301',
        use_overlay_text: true,
        paymentMethods: ['pix', 'credit', 'debit', 'cash'],
        shippingMethods: [
          {
            id: 'pickup',
            name: 'Retirada na loja',
            price: 0,
            description: 'Retire seu pedido diretamente em nossa loja'
          }
        ]
      };

      // Definir categorias fallback
      const defaultCategories = [
        'Ferramentas Elétricas',
        'Ferramentas Manuais',
        'Medição e Layout',
        'Acessórios'
      ];

      // Definir produtos fallback
      const defaultProducts: EcommerceProduct[] = [
        {
          id: '1',
          name: 'Furadeira Elétrica Profissional',
          code: 'FUR001',
          price: 299.90,
          description: 'Furadeira potente para trabalhos profissionais em madeira, metal e concreto.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/drill-img_d0312d92-22e0-47a1-b1d9-e5a7b1718c5e.png?v=1710403271',
          ncm: '8467.21.00',
          unit: 'UN',
          quantity: 15,
          stock: 15,
          inStock: true,
          category: 'Ferramentas Elétricas',
          slug: 'furadeira-eletrica-profissional'
        },
        {
          id: '2',
          name: 'Kit Chaves de Fenda 12 peças',
          code: 'KIT002',
          price: 89.90,
          description: 'Kit completo com 12 chaves de fenda de diversos tamanhos para diferentes aplicações.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-05_78755245-1963-467d-a128-bbcf43921b76.jpg?v=1710403282',
          ncm: '8205.40.00',
          unit: 'KIT',
          quantity: 28,
          stock: 28,
          inStock: true,
          category: 'Ferramentas Manuais',
          slug: 'kit-chaves-de-fenda-12-pecas'
        },
        {
          id: '3',
          name: 'Serra Circular 7 1/4"',
          code: 'SER003',
          price: 399.90,
          description: 'Serra circular potente com disco de 7 1/4" ideal para cortes precisos em madeira.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-03_1.jpg?v=1710403282',
          ncm: '8467.22.00',
          unit: 'UN',
          quantity: 10,
          stock: 10,
          inStock: true,
          category: 'Ferramentas Elétricas',
          slug: 'serra-circular-7-1-4'
        },
        {
          id: '4',
          name: 'Alicate Universal 8"',
          code: 'ALI004',
          price: 49.90,
          description: 'Alicate universal forjado em aço cromo-vanádio com cabo emborrachado.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-07.jpg?v=1710403283',
          ncm: '8203.20.10',
          unit: 'UN',
          quantity: 35,
          stock: 35,
          inStock: true,
          category: 'Ferramentas Manuais',
          slug: 'alicate-universal-8'
        },
        {
          id: '5',
          name: 'Trena 5m com Trava',
          code: 'TRE005',
          price: 29.90,
          description: 'Trena de 5 metros com sistema de trava e caixa ergonômica emborrachada.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-01_a2ab12aa-13b9-4d31-80b0-c7b99d57bba4.jpg?v=1710403281',
          ncm: '9017.80.90',
          unit: 'UN',
          quantity: 50,
          stock: 50,
          inStock: true,
          category: 'Medição e Layout',
          slug: 'trena-5m-com-trava'
        },
        {
          id: '6',
          name: 'Martelo Unha 29mm',
          code: 'MAR006',
          price: 59.90,
          description: 'Martelo unha com cabeça forjada em aço e cabo de madeira resistente.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-06_38b42f5e-0da7-4722-bf84-8a50c7c184f5.jpg?v=1710403283',
          ncm: '8205.20.00',
          unit: 'UN',
          quantity: 25,
          stock: 25,
          inStock: true,
          category: 'Ferramentas Manuais',
          slug: 'martelo-unha-29mm'
        },
        {
          id: '7',
          name: 'Parafusadeira/Furadeira 12V',
          code: 'PAF007',
          price: 249.90,
          description: 'Parafusadeira e furadeira 2 em 1 com bateria de 12V de longa duração.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-08_ed1b3cbc-1a68-481e-bb2a-53953b7ef575.jpg?v=1710403283',
          ncm: '8467.21.00',
          unit: 'UN',
          quantity: 8,
          stock: 8,
          inStock: true,
          category: 'Ferramentas Elétricas',
          slug: 'parafusadeira-furadeira-12v'
        },
        {
          id: '8',
          name: 'Jogo de Brocas para Concreto',
          code: 'BRO008',
          price: 79.90,
          description: 'Kit com 5 brocas para concreto de alta resistência e durabilidade.',
          imageUrl: 'https://demo-toolpart.myshopify.com/cdn/shop/files/product-04_b9e42f30-ed1f-4d75-af7e-b4929d455076.jpg?v=1710403282',
          ncm: '8207.19.00',
          unit: 'KIT',
          quantity: 20,
          stock: 20,
          inStock: true,
          category: 'Acessórios',
          slug: 'jogo-de-brocas-para-concreto'
        }
      ];

      // Carregar informações da loja
      try {
        const storeInfo = await EcommerceService.getStoreInfo();
        console.log('Informações da loja carregadas:', {
          nome: storeInfo?.name,
          logo: storeInfo?.logo ? 'Presente' : 'Ausente',
          banner: storeInfo?.banner_image_url ? 'Presente' : 'Ausente',
          overlay: storeInfo?.use_overlay_text
        });
        setStoreInfo(storeInfo);
      } catch (error) {
        console.error('Erro ao carregar informações da loja, usando fallback:', error);
        setStoreInfo(defaultStoreInfo);
      }
      
      // Carregar categorias
      try {
        const categoriesData = await EcommerceService.getCategories();
        setCategories(Array.isArray(categoriesData) ? 
          (typeof categoriesData[0] === 'string' ? 
            categoriesData : 
            categoriesData.map((cat: any) => cat.name || cat.toString())
          ) : []);
      } catch (error) {
        console.error('Erro ao carregar categorias, usando fallback:', error);
        setCategories(defaultCategories);
      }
      
      // Carregar produtos
      try {
        const { data, count } = await EcommerceService.getProducts(1, 100); // Carrega bastante para cache local
        setProducts(data);
        setFilteredProducts(data);
        setTotalProducts(count);
      } catch (error) {
        console.error('Erro ao carregar produtos, usando fallback:', error);
        setProducts(defaultProducts);
        setFilteredProducts(defaultProducts);
        setTotalProducts(defaultProducts.length);
      }
    } catch (error) {
      console.error('Erro geral ao carregar dados da loja:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao carregar os produtos. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadStoreData();
  }, [toast]);
  
  // Filtrar produtos quando o termo de pesquisa ou categoria mudar
  useEffect(() => {
    let result = [...products];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term) ||
        product.code.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);
  
  // Log de diagnóstico para o banner
  useEffect(() => {
    if (storeInfo?.banner_image_url) {
      console.log('Banner URL disponível:', storeInfo.banner_image_url);
    } else {
      console.log('Banner URL não disponível');
    }
  }, [storeInfo]);
  
  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  
  // Adicionar produto ao carrinho
  const handleAddToCart = (product: EcommerceProduct) => {
    addToCart(product, 1);
    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado ao carrinho`,
      variant: 'default',
    });
  };
  
  // Ver detalhes do produto
  const handleViewProduct = (product: EcommerceProduct) => {
    navigate(`/products/${product.id}`);
  };
  
  // Carregar mais produtos
  const loadMoreProducts = () => {
    setDisplayCount(prev => Math.min(prev + 12, filteredProducts.length));
  };
  
  // Produtos a exibir
  const productsToShow = filteredProducts.slice(0, displayCount);
  
  return (
    <StoreLayout>
      <ShoppingCartComponent />
      
      {/* Botões de suporte */}
      <div className="container mx-auto px-4 my-4 flex justify-end gap-2">
        <Button 
          variant="default"
          size="sm"
          onClick={checkAuthStatus}
          className="text-xs flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
        >
          <Info size={14} /> 
          Verificar Login
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleSignUp}
          className="text-xs flex items-center gap-1 border-green-500 text-green-500"
        >
          <User size={14} /> 
          Criar Usuário
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleLogin}
          className="text-xs flex items-center gap-1"
        >
          <User size={14} /> 
          Login Temporário
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleReloadStore}
          className="text-xs flex items-center gap-1"
        >
          <RefreshCw size={14} /> 
          Recarregar Banner
        </Button>
      </div>
      
      {/* Teste de carregamento direto do banner */}
      {storeInfo?.banner_image_url && (
        <div className="container mx-auto px-4 mb-4 border border-dashed border-red-500 p-2">
          <div className="text-xs bg-red-50 p-2 mb-2">
            <p className="font-bold">TESTE DE BANNER (apenas para diagnóstico)</p>
            <p>Testando carregamento da imagem com tag img: {storeInfo.banner_image_url}</p>
          </div>
          <img 
            src={`${storeInfo.banner_image_url}?v=${Date.now()}`} 
            alt="Teste de banner" 
            className="w-full max-h-40 object-cover border"
            onError={(e) => {
              console.error('Erro ao carregar imagem do banner:', e);
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).insertAdjacentHTML('afterend', '<div class="p-2 bg-red-100 text-red-700">Erro ao carregar a imagem</div>');
            }}
          />
        </div>
      )}
      
      {/* Hero Banner - Dinâmico */}
      <div className="relative overflow-hidden mb-8">
        {storeInfo?.banner_image_url ? (
          <div 
            className="relative overflow-hidden h-[300px] md:h-[580px] bg-gray-100 w-full"
            style={{
              backgroundImage: `url(${storeInfo.banner_image_url}?v=${Date.now()})`, // Evita cache do navegador
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              maxHeight: '580px',
              width: '100%'
            }}
            aria-label="Banner principal da loja"
            onClick={() => console.log('Banner URL (clique):', storeInfo.banner_image_url)}
          >
            {/* Elemento de diagnóstico visível apenas para fins de depuração */}
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
              URL do banner: {storeInfo.banner_image_url}
            </div>
            
            {(() => { console.log('Tentando exibir banner com URL:', storeInfo.banner_image_url); return null; })()}
            {storeInfo.use_overlay_text && (
              <div className="container mx-auto px-4 py-10 h-full flex items-center">
                <div className="md:w-1/2 bg-black bg-opacity-50 text-white p-6 md:p-8 rounded-lg shadow-lg backdrop-blur-sm">
                  <div className="bg-yellow-500 text-black inline-block px-3 py-1 mb-4 rounded">
                    <span className="font-bold">Destaque</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold mb-4">
                    {storeInfo.name || 'Bem-vindo à nossa loja'}
                  </h1>
                  <p className="text-sm md:text-lg mb-6">
                    {storeInfo.description || 'Os melhores produtos para você'}
                  </p>
                  <Button 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => {
                      const productsSection = document.getElementById('products-section');
                      if (productsSection) {
                        productsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Ver produtos
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-500 text-black relative overflow-hidden">
            <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 z-10">
                <div className="bg-black text-white inline-block px-3 py-1 mb-4 rounded">
                  <span className="font-bold">35% OFF</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {storeInfo?.name || 'Loja Online'}
              </h1>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Os melhores produtos
                </h2>
                <p className="text-2xl font-bold mb-4">
                  {formatPrice(49)}
                </p>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white mt-2"
                  onClick={() => {
                    const productsSection = document.getElementById('products-section');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Ver produtos
                </Button>
              </div>
              <div className="md:w-1/2 relative h-[200px] md:h-[300px]">
                <img 
                  src="https://demo-toolpart.myshopify.com/cdn/shop/files/drill-img_d0312d92-22e0-47a1-b1d9-e5a7b1718c5e.png?v=1710403271" 
                  alt="Destaque" 
                  className="absolute right-0 bottom-0 max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Benefícios - Estilo Toolpart */}
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <Truck className="text-yellow-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Frete Grátis</h3>
              <p className="text-xs text-gray-500">Para compras acima de R$99</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <RefreshCw className="text-yellow-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Política de Devolução</h3>
              <p className="text-xs text-gray-500">30 dias para devolução sem encargos</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <Check className="text-yellow-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Suporte Online</h3>
              <p className="text-xs text-gray-500">24 horas por dia, 7 dias por semana</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg">
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <CreditCard className="text-yellow-500" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Pagamento Flexível</h3>
              <p className="text-xs text-gray-500">Pague com múltiplos cartões de crédito</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barra de pesquisa e filtros */}
      <div className="mb-8 container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Pesquisar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Todos
            </Button>
            
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap ${
                  selectedCategory === category 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                    : ''
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Listagem de produtos */}
      <div id="products-section" className="container mx-auto px-4 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {selectedCategory ? selectedCategory : 'Todos os Produtos'}
          </h2>
          <div className="text-sm text-gray-500">
            Mostrando {Math.min(displayCount, filteredProducts.length)} de {filteredProducts.length} produtos
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="border rounded-lg p-4 flex flex-col">
                <Skeleton className="w-full h-40 rounded-md mb-4" />
                <Skeleton className="w-3/4 h-6 mb-2" />
                <Skeleton className="w-1/2 h-4 mb-4" />
                <Skeleton className="w-1/3 h-8" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="w-1/3 h-10" />
                  <Skeleton className="w-1/3 h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              Não encontramos produtos com os filtros selecionados.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsToShow.map(product => (
                <div 
                  key={product.id} 
                  className="border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div 
                    className="h-48 bg-gray-100 relative group cursor-pointer"
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ShoppingBag size={32} className="text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} />
                        Ver detalhes
                      </Button>
                    </div>
                    
                    {product.category && (
                      <Badge className="absolute top-2 left-2 bg-black bg-opacity-80 text-white hover:bg-black">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 
                      className="font-medium mb-1 hover:text-yellow-500 cursor-pointer"
                      onClick={() => handleViewProduct(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-2">
                      Código: {product.code}
                    </p>
                    
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="mt-auto">
                      <div className="flex items-baseline">
                        <p className="text-lg font-bold text-black">
                          {formatPrice(product.price)}
                        </p>
                        {product.unit && (
                          <span className="text-xs text-gray-500 ml-1">
                            / {product.unit}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Button 
                          className="flex-1 bg-black hover:bg-yellow-500 text-white"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart size={16} className="mr-1" />
                          Adicionar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {displayCount < filteredProducts.length && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMoreProducts}
                  className="px-8 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                >
                  Carregar mais produtos
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Newsletter - Estilo Toolpart */}
      <div className="bg-yellow-500 py-10 mb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:w-1/2">
              <h2 className="text-2xl font-bold text-black mb-2">
                Assine nossa newsletter e ganhe R$20 de desconto
              </h2>
              <p className="text-black text-opacity-80">
                Seja o primeiro a saber sobre novos produtos e ofertas exclusivas.
              </p>
            </div>
            <div className="w-full md:w-1/2 md:max-w-md">
              <div className="flex">
                <Input
                  placeholder="Seu melhor e-mail..."
                  className="rounded-r-none bg-white text-black"
                />
                <Button className="rounded-l-none bg-black hover:bg-gray-800 text-white">
                  Assinar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Ecommerce; 