import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ArrowLeft,
  ArrowRight
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
import { loadGoogleFont } from '@/utils/loadGoogleFont';
import { useAuth } from '@/contexts/AuthContext';
import { applyStoreTheme } from '@/utils/applyStoreTheme';
import WhatsAppFloatingButton from '@/components/ecommerce/WhatsAppFloatingButton';

// Importações do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';

// Estilos do Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const EcommerceNew: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, isCartOpen } = useCart();
  const { user } = useAuth ? useAuth() : { user: null };
  
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

  // Estado para o carrossel de produtos em destaque mobile
  const [currentFeaturedMobilePage, setCurrentFeaturedMobilePage] = useState(0);
  const ITEMS_PER_MOBILE_FEATURED_PAGE = 2;
  
  // Função para configurar o favicon dinamicamente
  const setFavicon = useCallback((faviconUrl: string) => {
    if (!faviconUrl) return;
    
    const linkElements = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    
    // Remover favicons existentes
    linkElements.forEach(link => link.parentNode?.removeChild(link));
    
    // Adicionar o novo favicon
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/png';
    newLink.href = faviconUrl;
    document.head.appendChild(newLink);
    
    // Adicionar também para dispositivos Apple
    const appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    appleTouchLink.href = faviconUrl;
    document.head.appendChild(appleTouchLink);
  }, []);
  
  // Verificar se temos as configurações da loja no cache
  useEffect(() => {
    const cachedStoreInfo = localStorage.getItem('store_info_cache');
    if (cachedStoreInfo) {
      try {
        const parsedInfo = JSON.parse(cachedStoreInfo);
        const cacheAge = new Date().getTime() - parsedInfo._cachedAt;
        // Usar cache se tiver menos de 5 minutos
        if (cacheAge < 5 * 60 * 1000) {
          setStoreInfo(parsedInfo);
          
          // Carregar fonte se disponível no cache
          if (parsedInfo.font_family) {
            loadGoogleFont(parsedInfo.font_family);
          }
          
          // Aplicar tema baseado no cache
          applyStoreTheme(parsedInfo);
          
          // Configurar o favicon se disponível
          if (parsedInfo.favicon_url) {
            setFavicon(parsedInfo.favicon_url);
          }
        }
      } catch (e) {
        console.error('Erro ao processar cache da loja:', e);
      }
    }
  }, [setFavicon]);

  // Carregar produtos e informações da loja
  useEffect(() => {
    const loadStoreData = async () => {
      setIsLoading(true);
      
      try {
        // Buscar ownerId do usuário logado, se existir
        const ownerId = user?.id || undefined;
        
        // Fazer requisições em paralelo
        const [storeInfoData, categoriesData, productsData, cardStylesData] = await Promise.all([
          EcommerceService.getStoreInfo(false, ownerId),
          EcommerceService.getCategories(),
          EcommerceService.getProducts(1, 24), // Reduzir quantidade inicial para melhorar desempenho
          EcommerceService.getProductCardStyles() // Nova chamada para buscar estilos dos cards
        ]);
        
        // Combinar os estilos do card com as informações da loja
        const combinedStoreInfo = {
          ...storeInfoData,
          cardStyles: cardStylesData
        };
        
        // Atualizar estados com os dados obtidos
        setStoreInfo(combinedStoreInfo);

        // Configurar o favicon
        if (combinedStoreInfo?.favicon_url) {
          setFavicon(combinedStoreInfo.favicon_url);
        }

        // Salvar no localStorage com timestamp
        if (combinedStoreInfo) {
          const cacheData = {
            ...combinedStoreInfo,
            _cachedAt: new Date().getTime()
          };
          localStorage.setItem('store_info_cache', JSON.stringify(cacheData));
        }
        
        // Processar categorias
        setCategories(Array.isArray(categoriesData) ? 
          (typeof categoriesData[0] === 'string' ? 
            categoriesData : 
            categoriesData.map((cat: any) => cat.name || cat.toString())
          ) : []);
        
        // Processar produtos
        setProducts(productsData.data);
        setFilteredProducts(productsData.data);
        setTotalProducts(productsData.count);
      } catch (error) {
        console.error('Erro ao carregar dados da loja:', error);
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao carregar os produtos. Por favor, tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoreData();
  }, [toast, user, setFavicon]);
  
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
  
  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  
  // Adicionar produto ao carrinho - com useCallback para evitar recriações desnecessárias
  const handleAddToCart = useCallback((product: EcommerceProduct) => {
    addToCart(product, 1);
    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado ao carrinho`,
      variant: 'default',
    });
  }, [addToCart, toast]);
  
  // Ver detalhes do produto - com useCallback
  const handleViewProduct = useCallback((product: EcommerceProduct) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);
  
  // Carregar mais produtos - com useCallback
  const loadMoreProducts = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 12, filteredProducts.length));
  }, [filteredProducts.length]);
  
  // Produtos a exibir - usando useMemo para evitar recálculos desnecessários
  const productsToShow = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);
  
  // Extrair produtos em destaque (primeiros 5) - usando useMemo
  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);
  
  // Extrair produtos tendência (próximos 6) - usando useMemo
  const trendingProducts = useMemo(() => products.slice(6, 12), [products]);

  // Lógica para o carrossel de produtos em destaque mobile
  const totalFeaturedMobilePages = Math.ceil(featuredProducts.length / ITEMS_PER_MOBILE_FEATURED_PAGE);
  
  const handlePrevFeaturedMobile = useCallback(() => {
    setCurrentFeaturedMobilePage(prev => Math.max(0, prev - 1));
  }, []);
  
  const handleNextFeaturedMobile = useCallback(() => {
    setCurrentFeaturedMobilePage(prev => Math.min(totalFeaturedMobilePages - 1, prev + 1));
  }, [totalFeaturedMobilePages]);
  
  // Produtos visíveis no carrossel - usando useMemo
  const visibleFeaturedMobileProducts = useMemo(() => {
    const startIndexFeaturedMobile = currentFeaturedMobilePage * ITEMS_PER_MOBILE_FEATURED_PAGE;
    return featuredProducts.slice(
      startIndexFeaturedMobile,
      startIndexFeaturedMobile + ITEMS_PER_MOBILE_FEATURED_PAGE
    );
  }, [featuredProducts, currentFeaturedMobilePage]);
  
  // Carregar fonte apenas quando a informação da fonte mudar e não estiver já carregada
  useEffect(() => {
    const loadedFonts = document.querySelector('#google-fonts')?.getAttribute('data-loaded-fonts') || '';
    
    if (storeInfo?.font_family && !loadedFonts.includes(storeInfo.font_family)) {
      loadGoogleFont(storeInfo.font_family);
    }
  }, [storeInfo?.font_family]);
  
  // Aplicar tema da loja apenas quando storeInfo mudar e não for null
  useEffect(() => {
    if (storeInfo) {
      applyStoreTheme(storeInfo);
      
      // Atualizar título da página
      if (storeInfo.name) {
        document.title = storeInfo.name;
      }
    }
  }, [storeInfo]);
  
  // Estilos do carrossel aplicados apenas uma vez na montagem do componente
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const existingStyle = document.getElementById('featured-swiper-styles');
      if (!existingStyle) {
        const styleElement = document.createElement('style');
        styleElement.id = 'featured-swiper-styles';
        styleElement.innerHTML = `
          .featured-swiper {
            padding-bottom: 40px;
          }
          .featured-swiper .swiper-pagination {
            bottom: 0;
          }
          .featured-swiper .swiper-pagination-bullet {
            background-color: var(--store-primary, #000000);
          }
          .featured-swiper .swiper-slide {
            height: auto;
          }
          
          /* Estilos para animação do carrossel */
          .swiper-slide {
            transition: transform 0.3s ease;
          }
          .swiper-slide-active {
            transform: scale(1);
          }
          
          /* Cores personalizadas para os botões de navegação */
          .swiper-button-prev-featured,
          .swiper-button-next-featured {
            transition: all 0.2s ease;
          }
          .swiper-button-prev-featured:hover,
          .swiper-button-next-featured:hover {
            background-color: var(--store-primary, #000);
            color: white;
            border-color: var(--store-primary, #000);
          }
          
          /* Ajustes responsivos */
          @media (max-width: 768px) {
            .featured-swiper {
              padding-bottom: 30px;
            }
          }
        `;
        document.head.appendChild(styleElement);
      }
    }
      
    // Limpeza ao desmontar o componente
    return () => {
      if (typeof document !== 'undefined') {
        const styleElement = document.getElementById('featured-swiper-styles');
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      }
    };
  }, []);
  
  // Adicionar estilos de animação
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes typing {
        from { width: 0 }
        to { width: 100% }
      }
      
      .animate-typing::placeholder {
        overflow: hidden;
        white-space: nowrap;
        animation: typing 1s steps(20, end);
      }
      
      .animate-typing:focus::placeholder {
        animation: none;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return (
    <StoreLayout>
      <ShoppingCartComponent />
      <WhatsAppFloatingButton />
      <div style={{ fontFamily: storeInfo?.font_family || undefined }}>
        
        {/* Hero Banner agora dentro de um container para centralização e padding adequados */}
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="mb-8 mt-[10px]">
              {/* Skeleton com proporção aproximada para evitar reflow brusco */}
              <Skeleton className="w-full aspect-[1920/580] rounded-[15px]" />
            </div>
          ) : storeInfo?.banner_image_url ? (
            <div className="relative overflow-hidden mb-8 mt-[10px] rounded-[15px] shadow-lg">
              <img 
                src={storeInfo.banner_image_url} 
                alt={storeInfo.name || 'Banner Principal da Loja'} 
                className="w-full h-auto object-cover object-center block"
              />
              {/* Opcional: Adicionar texto ou botões sobrepostos ao banner aqui, se necessário no futuro */}
            </div>
          ) : (
            // Fallback se não houver banner_image_url
            <div className="bg-yellow-500 text-black relative overflow-hidden mb-8 mt-[10px] rounded-[15px]">
              <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 z-10">
                  <div className="bg-black text-white inline-block px-3 py-1 mb-4 rounded">
                    <span className="font-bold">DESTAQUE</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {storeInfo?.name || 'Nossa Loja'}
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Confira Nossas Novidades
                  </h2>
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white mt-2"
                    onClick={() => navigate('#products-section')}
                  >
                    Ver Produtos
                  </Button>
                </div>
                <div className="md:w-1/2 relative h-[200px] md:h-[300px] flex items-center justify-center">
                  {storeInfo?.logo && (
                    <img 
                      src={storeInfo.logo}
                      alt={storeInfo.name || 'Logo da Loja'}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
      {/* Benefícios */}
      <div className="container mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[var(--store-primary)] transition-colors">
            <div className="bg-[var(--store-primary-light,#f3f4f6)] p-2 rounded-full mr-3">
              <Truck 
                style={{ color: 'var(--store-primary)' }} 
                size={20} 
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Frete Grátis</h3>
              <p className="text-xs text-gray-500">Para compras acima de R$99</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[var(--store-primary)] transition-colors">
            <div className="bg-[var(--store-primary-light,#f3f4f6)] p-2 rounded-full mr-3">
              <RefreshCw 
                style={{ color: 'var(--store-primary)' }} 
                size={20} 
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Política de Devolução</h3>
              <p className="text-xs text-gray-500">30 dias para devolução sem encargos</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[var(--store-primary)] transition-colors">
            <div className="bg-[var(--store-primary-light,#f3f4f6)] p-2 rounded-full mr-3">
              <Check 
                style={{ color: 'var(--store-primary)' }} 
                size={20} 
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Suporte Online</h3>
              <p className="text-xs text-gray-500">24 horas por dia, 7 dias por semana</p>
            </div>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-[var(--store-primary)] transition-colors">
            <div className="bg-[var(--store-primary-light,#f3f4f6)] p-2 rounded-full mr-3">
              <CreditCard 
                style={{ color: 'var(--store-primary)' }} 
                size={20} 
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Pagamento Flexível</h3>
              <p className="text-xs text-gray-500">Pague com múltiplos cartões de crédito</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Categorias Populares */}
      <div className="container mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold mb-6">Categorias Populares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((category, index) => (
            <div 
              key={index}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-[var(--store-primary)] cursor-pointer transition-all"
              onClick={() => setSelectedCategory(category)}
            >
              <div className="w-16 h-16 bg-[var(--store-primary-light,#f3f4f6)] rounded-full flex items-center justify-center mb-3">
                <ShoppingBag 
                  style={{ color: 'var(--store-primary)' }} 
                  size={24} 
                />
              </div>
              <h3 className="text-sm font-medium text-center">{category}</h3>
              <p className="text-xs text-gray-500">Ver tudo</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Coleção em Destaque */}
      <div className="container mx-auto px-4 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
          <div className="flex gap-2">
            <button 
              className="p-2 rounded-full border border-[var(--store-primary)] hover:bg-[var(--store-primary)] hover:text-white transition-colors swiper-button-prev-featured"
              aria-label="Produto anterior"
              style={{ color: 'var(--store-primary)' }}
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              className="p-2 rounded-full border border-[var(--store-primary)] hover:bg-[var(--store-primary)] hover:text-white transition-colors swiper-button-next-featured"
              aria-label="Próximo produto"
              style={{ color: 'var(--store-primary)' }}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Mobile Carousel for Featured Products */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex gap-4">
              {Array(2).fill(null).map((_, i) => (
                <div key={i} className="w-1/2 border rounded-lg p-4">
                  <Skeleton className="w-full h-32 mb-3" />
                  <Skeleton className="w-2/3 h-4 mb-2" />
                  <Skeleton className="w-1/2 h-6 mb-2" />
                  <Skeleton className="w-full h-8 mt-2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination, A11y]}
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                320: { slidesPerView: 1.5 },
                480: { slidesPerView: 2 }
              }}
              pagination={{ clickable: true }}
              navigation={{
                prevEl: '.swiper-button-prev-featured',
                nextEl: '.swiper-button-next-featured',
              }}
              grabCursor={true}
              className="featured-swiper"
            >
              {visibleFeaturedMobileProducts.map((product, index) => (
                <SwiperSlide key={product.id || `featured-mobile-${index}`}>
                  <div className="product-card border border-gray-200 rounded-lg overflow-hidden group h-full flex flex-col">
                    <div className="relative">
                      {/* Placeholder para imagem não disponível */}
                      {!product.imageUrl && (
                        <div className="w-full h-40 bg-[var(--store-primary-light,#f3f4f6)] flex items-center justify-center">
                          <ShoppingBag 
                            size={30} 
                            className="text-[var(--store-primary)]" 
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-white hover:bg-[var(--store-primary)] hover:text-white p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-sm">
                          {formatPrice(product.price)}
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={12} 
                              className={`${star <= 4 ? 'text-[var(--store-primary)]' : 'text-gray-300'} fill-current`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto pt-2">
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="w-full text-xs p-2 rounded-sm"
                          style={{ 
                            backgroundColor: 'var(--store-primary)', 
                            color: 'var(--store-primary-foreground)' 
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary)'}
                        >
                          Adicionar ao carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="text-center text-gray-500">Nenhum produto em destaque no momento.</p>
          )}
        </div>

        {/* Desktop Grid for Featured Products */}
        <div className="hidden md:block">
          {isLoading 
            ? (
              <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array(6).fill(null).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="w-full h-32 mb-3" />
                    <Skeleton className="w-2/3 h-4 mb-2" />
                    <Skeleton className="w-1/2 h-6 mb-2" />
                  </div>
                ))}
              </div>
            ) 
            : featuredProducts.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                spaceBetween={16}
                slidesPerView={4}
                breakpoints={{
                  768: { slidesPerView: 4 },
                  1024: { slidesPerView: 5 },
                  1280: { slidesPerView: 6 }
                }}
                pagination={{ clickable: true }}
                navigation={{
                  prevEl: '.swiper-button-prev-featured',
                  nextEl: '.swiper-button-next-featured',
                }}
                grabCursor={true}
                className="featured-swiper"
              >
                {visibleFeaturedMobileProducts.map((product, index) => (
                  <SwiperSlide key={product.id || `desktop-${index}`}>
                    <div className="product-card border border-gray-200 rounded-lg overflow-hidden group h-full flex flex-col">
                      <div className="relative">
                        {/* Placeholder para imagem não disponível */}
                        {!product.imageUrl && (
                          <div className="w-full h-40 bg-[var(--store-primary-light,#f3f4f6)] flex items-center justify-center">
                            <ShoppingBag 
                              size={30} 
                              className="text-[var(--store-primary)]" 
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="bg-white hover:bg-[var(--store-primary)] hover:text-white p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 flex flex-col flex-grow">
                        <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-sm">
                            {formatPrice(product.price)}
                          </p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={12} 
                                className={`${star <= 4 ? 'text-[var(--store-primary)]' : 'text-gray-300'} fill-current`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-auto pt-2">
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="w-full text-xs p-2 rounded-sm"
                            style={{ 
                              backgroundColor: 'var(--store-primary)', 
                              color: 'var(--store-primary-foreground)' 
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary)'}
                          >
                            Adicionar ao carrinho
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <p className="text-center text-gray-500">Nenhum produto em destaque no momento.</p>
            )
          }
        </div>
      </div>
      
      {/* Todos os produtos */}
      <div id="products-section" className="container mx-auto px-4 mb-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-2xl font-bold mb-4 sm:mb-0">
            {selectedCategory ? selectedCategory : 'Todos os Produtos'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-auto group">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-colors duration-200 group-hover:text-[var(--store-primary)]" 
                size={18} 
              />
              <Input
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 w-full sm:w-64 bg-white rounded-lg border border-gray-200 
                  focus:ring-2 focus:ring-[var(--store-primary)] focus:border-transparent
                  transition-all duration-300 ease-in-out
                  text-base font-medium placeholder:text-gray-400
                  hover:border-[var(--store-primary)] hover:shadow-sm
                  focus:shadow-md animate-typing"
              />
            </div>
            <div className="text-sm text-gray-500 self-start sm:self-center">
              Mostrando {Math.min(displayCount, filteredProducts.length)} de {filteredProducts.length} produtos
            </div>
          </div>
        </div>
        
        {/* Filtros expandidos */}
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtro por Categoria */}
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-2">Categorias</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 mb-0 sm:mb-2 sm:flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white border-none"
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
                  ? 'bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white' 
                  : 'border-gray-300 hover:border-[var(--store-primary)]'
              }`}
            >
              {category}
            </Button>
          ))}
              </div>
            </div>
            
            {/* Filtros adicionais podem ser adicionados aqui como preço, avaliação, etc. */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="sm:border-l sm:pl-4 flex-shrink-0">
                <h3 className="text-sm font-medium mb-2">Ordenar por</h3>
                <select className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white">
                  <option value="relevant">Mais relevantes</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="newest">Mais novos</option>
                </select>
              </div>
              <div className="sm:border-l sm:pl-4 flex-shrink-0">
                <h3 className="text-sm font-medium mb-2">Mostrar</h3>
                <select 
                  className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white"
                  value={displayCount}
                  onChange={(e) => setDisplayCount(Number(e.target.value))}
                >
                  <option value="12">12 por página</option>
                  <option value="24">24 por página</option>
                  <option value="36">36 por página</option>
                  <option value="48">48 por página</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="border rounded-lg p-4 flex flex-col">
                <Skeleton className="w-full h-32 sm:h-40 rounded-md mb-4" />
                <Skeleton className="w-3/4 h-4 sm:h-6 mb-2" />
                <Skeleton className="w-1/2 h-3 sm:h-4 mb-4" />
                <Skeleton className="w-1/3 h-3 sm:h-4 mb-4" />
                <div className="mt-auto">
                  <Skeleton className="w-full h-8 sm:h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag 
              size={64} 
              className="mx-auto text-[var(--store-primary)] mb-4" 
            />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              Não encontramos produtos com os filtros selecionados.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
              }}
              className="bg-[var(--store-primary)] hover:bg-[var(--store-primary-hover)] text-white"
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsToShow.map(product => (
                <div 
                  key={product.id} 
                  className="product-card border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div 
                    className="h-32 sm:h-48 bg-gray-100 relative"
                    onClick={() => handleViewProduct(product)}
                  >
                    {/* Placeholder para imagem não disponível */}
                    {!product.imageUrl && (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--store-primary-light,#f3f4f6)]">
                        <ShoppingBag 
                          size={32} 
                          className="text-[var(--store-primary)]" 
                        />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                      <Badge 
                        className="absolute top-2 left-2 bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-hover)]"
                      >
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1">
                    <h3 
                      className="font-medium mb-1 hover:text-[var(--store-primary)] cursor-pointer text-sm line-clamp-2"
                      onClick={() => handleViewProduct(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-xs text-gray-500 mb-1">
                      Código: {product.code}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex items-baseline mb-2">
                        <p className="text-base sm:text-lg font-bold text-black">
                          {formatPrice(product.price)}
                        </p>
                        {product.unit && (
                          <span className="text-xs text-gray-500 ml-1">
                            / {product.unit}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 text-xs py-1 sm:py-2"
                          style={{ 
                            backgroundColor: 'var(--store-primary)', 
                            color: 'var(--store-primary-foreground)'
                          }}
                          onClick={() => handleAddToCart(product)}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary-hover)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-primary)'}
                        >
                          <ShoppingCart size={14} className="mr-1 hidden sm:inline" />
                          <span className="hidden sm:inline">Adicionar</span>
                          <span className="sm:hidden">+ Carrinho</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0 hidden sm:flex border-[var(--store-primary)] text-[var(--store-primary)] hover:bg-[var(--store-primary)] hover:text-white"
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
                    className="px-8"
                    style={{
                      borderColor: 'var(--store-primary)',
                      color: 'var(--store-primary)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--store-primary)';
                      e.currentTarget.style.color = 'var(--store-primary-foreground)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--store-primary)';
                    }}
                >
                  Carregar mais produtos
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Newsletter */}
        <div style={{ backgroundColor: 'var(--store-primary)' }} className="py-10 mb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:w-1/2">
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--store-primary-foreground)' }}>
                Assine nossa newsletter e ganhe R$20 de desconto na primeira compra
              </h2>
                <p style={{ color: 'var(--store-primary-foreground)', opacity: 0.8 }}>
                Seja o primeiro a saber sobre novos produtos e ofertas exclusivas.
              </p>
            </div>
            <div className="w-full md:w-1/2 md:max-w-md">
              <div className="flex">
                <Input
                  placeholder="Seu melhor e-mail..."
                  className="rounded-r-none bg-white text-black"
                />
                  <Button 
                    className="rounded-l-none"
                    style={{
                       backgroundColor: 'var(--store-secondary)',
                       color: 'var(--store-secondary-foreground)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--store-accent)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--store-secondary)'}
                  >
                  Assinar
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default EcommerceNew; 