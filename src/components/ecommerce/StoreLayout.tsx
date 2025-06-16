import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { EcommerceService, StoreInfo } from '@/services/ecommerceService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface StoreLayoutProps {
  children: ReactNode;
}

const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { cartItems } = useCart();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carregar informações da loja
  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        const info = await EcommerceService.getStoreInfo();
        console.log('StoreLayout: Informações da loja carregadas:', {
          nome: info?.store_name || info?.name,
          logo: info?.logo_url || info?.logo ? 'Presente' : 'Ausente'
        });
        setStoreInfo(info);
      } catch (error) {
        console.error('Erro ao carregar informações da loja:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoreInfo();
  }, []);
  
  // Função para lidar com a pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/ecommerce/search?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--store-header-background, var(--store-primary))' }}>
        <div className="container mx-auto px-4">
          {/* Layout Desktop */}
          <div className="hidden md:flex items-center justify-between h-20">
            {/* Logo Desktop */}
            <div className="flex-shrink-0">
              <Link 
                to="/ecommerce" 
                className="text-2xl font-bold flex items-center text-white hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <Skeleton className="h-12 w-40" />
                ) : storeInfo?.logo_url ? (
                  <div className="relative overflow-hidden rounded-full bg-white/10 h-12 w-12">
                  <img 
                      src={storeInfo.logo_url} 
                      alt={storeInfo.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold tracking-tight">
                    {storeInfo?.store_name || storeInfo?.name || 'Loja Online'}
                  </div>
                )}
              </Link>
            </div>
            
            {/* Barra de pesquisa - Desktop */}
            <div className="flex flex-1 max-w-xl mx-12">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <Input 
                    type="search"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder:text-white/70 focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
                  />
                  <Search 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 group-focus-within:text-white transition-colors" 
                    size={20} 
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                </form>
              </div>
              
            {/* Ações - Desktop */}
            <div className="flex items-center space-x-6">
              <Link to="/ecommerce/wishlist">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-white/10 transition-colors"
                >
                  Lista de Desejos
                </Button>
              </Link>
              <Link to="/ecommerce/cart" className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-white/10 transition-colors"
              >
                  <ShoppingCart size={20} className="mr-2" />
                  Carrinho
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[var(--store-primary)] text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-[var(--store-primary)]">
                      {cartItems.length}
                  </span>
                )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Layout Mobile */}
          <div className="md:hidden">
            {/* Barra Superior Mobile */}
            <div className="flex items-center justify-between h-14">
            <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

              <Link to="/ecommerce/cart" className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ShoppingCart size={24} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[var(--store-primary)] text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-[var(--store-primary)]">
                      {cartItems.length}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Logo Centralizada Mobile - Vazando para fora */}
            <div className="flex justify-center -mb-6">
              <Link 
                to="/ecommerce" 
                className="relative -top-4"
              >
                {isLoading ? (
                  <Skeleton className="h-16 w-16 rounded-full" />
                ) : storeInfo?.logo_url ? (
                  <div className="relative overflow-hidden rounded-full bg-white/10 h-20 w-20 border-4 border-[var(--store-header-background,var(--store-primary))]">
                    <img 
                      src={storeInfo.logo_url} 
                      alt={storeInfo.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-2xl font-extrabold tracking-tight text-white text-center">
                    {storeInfo?.store_name || storeInfo?.name || 'Loja Online'}
                  </div>
                )}
              </Link>
            </div>

            {/* Menu Mobile Expandido */}
            {mobileMenuOpen && (
              <div className="py-4 border-t border-white/10 mt-6">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative group">
              <Input
                      type="search"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder:text-white/70 focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
                    />
                    <Search 
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 group-focus-within:text-white transition-colors" 
                      size={20} 
                    />
                    {searchTerm && (
                  <button 
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                  >
                        <X size={16} />
                  </button>
                    )}
                  </div>
                </form>
                <div className="space-y-2">
              <Link 
                  to="/ecommerce/wishlist" 
                    className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)} 
                >
                  Lista de Desejos
              </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="flex-grow bg-gray-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sobre a Loja */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Sobre Nós</h3>
              <p className="text-gray-600 text-sm">
                {storeInfo?.description || 'Bem-vindo à nossa loja online. Encontre os melhores produtos com os melhores preços.'}
              </p>
            </div>
            
            {/* Links Úteis */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/ecommerce" className="text-gray-600 hover:text-[var(--store-primary)] text-sm">
                    Página Inicial
                  </Link>
                </li>
                <li>
                  <Link to="/ecommerce/products" className="text-gray-600 hover:text-[var(--store-primary)] text-sm">
                    Produtos
                  </Link>
                </li>
                <li>
                  <Link to="/ecommerce/cart" className="text-gray-600 hover:text-[var(--store-primary)] text-sm">
                    Carrinho
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contato */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Contato</h3>
              {storeInfo ? (
                <ul className="space-y-2 text-sm text-gray-600">
                  {storeInfo.address && (
                    <li>{storeInfo.address}</li>
                  )}
                  {storeInfo.phone && (
                    <li>{storeInfo.phone}</li>
                  )}
                  {storeInfo.email && (
                    <li>{storeInfo.email}</li>
                  )}
              </ul>
              ) : (
                <Skeleton className="h-20 w-full" />
              )}
            </div>
            
            {/* Redes Sociais */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Redes Sociais</h3>
              {storeInfo ? (
                <div className="flex space-x-4">
                  {storeInfo.footer_social_facebook && (
                    <a href={storeInfo.footer_social_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[var(--store-primary)]">
                      Facebook
                    </a>
                  )}
                  {storeInfo.footer_social_instagram && (
                    <a href={storeInfo.footer_social_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[var(--store-primary)]">
                      Instagram
                    </a>
                  )}
                      </div>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} {storeInfo?.name || 'Loja Online'}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StoreLayout; 