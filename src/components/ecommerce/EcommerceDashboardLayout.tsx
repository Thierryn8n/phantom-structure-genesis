import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, ShoppingBag, Settings, Package, FileText, BarChart, ShoppingCart, LogOut, Menu, X, Home, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EcommerceDashboardLayoutProps {
  children: ReactNode;
}

const EcommerceDashboardLayout: React.FC<EcommerceDashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Verificar qual rota está ativa
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logout realizado com sucesso',
        description: 'Você foi desconectado do sistema.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Ocorreu um erro ao tentar desconectar.',
        variant: 'destructive',
      });
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50" 
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Menu lateral do Ecommerce Dashboard - Escondido em mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm rounded-tr-2xl rounded-br-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <h2 className="font-bold text-xl flex items-center">
            <ShoppingCart className="mr-2 text-fiscal-green-600" size={20} />
            Dashboard E-commerce
          </h2>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <ul className="space-y-1">
            <li>
              <Link
                to="/ecommerce"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100`}
              >
                <ShoppingBag size={18} className="mr-2" />
                <span>Ver Loja</span>
              </Link>
            </li>
            <li className="my-3 border-t border-gray-100"></li>
            <li>
              <Link
                to="/ecommerce/dashboard"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/dashboard')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <BarChart size={18} className="mr-2" />
                <span>Visão Geral</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ecommerce/orders"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/orders')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <FileText size={18} className="mr-2" />
                <span>Pedidos (Kanban)</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ecommerce/products"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/products')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <Package size={18} className="mr-2" />
                <span>Produtos</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ecommerce/categories"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/categories')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <Tags size={18} className="mr-2" />
                <span>Categorias</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ecommerce/customers"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/customers')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <Users size={18} className="mr-2" />
                <span>Clientes</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ecommerce/settings"
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive('/ecommerce/settings')
                    ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <Settings size={18} className="mr-2" />
                <span>Configurações da Loja</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-transparent to-gray-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-100 transition-all duration-200"
          >
            <LogOut size={18} className="mr-2" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {/* Header Mobile */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden shadow-sm">
          <div className="flex items-center">
            <ShoppingCart className="text-fiscal-green-600 mr-2" size={24} />
            <h1 className="font-bold text-lg">Dashboard E-commerce</h1>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <Menu size={24} />
          </button>
        </header>

        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl p-4 md:p-6 transition-all duration-300">
              {children}
            </div>
          </div>
        </div>

        {/* Menu Flutuante Mobile */}
        <div className="fixed bottom-4 left-0 right-0 mx-auto w-[95%] max-w-sm bg-white border border-gray-200 rounded-full shadow-lg md:hidden">
          <div className="flex justify-around items-center py-2">
            <Link 
              to="/ecommerce"
              className="flex flex-col items-center p-2 text-gray-600 hover:text-fiscal-green-600 transition-colors duration-200"
            >
              <ShoppingBag size={22} />
              <span className="text-xs mt-1 font-medium">Loja</span>
            </Link>
            <Link 
              to="/ecommerce/dashboard"
              className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive('/ecommerce/dashboard') ? 'text-fiscal-green-600' : 'text-gray-600 hover:text-fiscal-green-600'
              }`}
            >
              <BarChart size={22} />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="flex flex-col items-center justify-center p-2 relative"
            >
              <div className="bg-fiscal-green-500 rounded-full h-12 w-12 flex items-center justify-center -mt-5 shadow-lg hover:bg-fiscal-green-600 transition-colors duration-200">
                <Menu size={24} className="text-white" />
              </div>
              <span className="text-xs mt-1 text-fiscal-green-600 font-medium">Menu</span>
            </button>
            <Link 
              to="/ecommerce/orders"
              className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive('/ecommerce/orders') ? 'text-fiscal-green-600' : 'text-gray-600 hover:text-fiscal-green-600'
              }`}
            >
              <FileText size={22} />
              <span className="text-xs mt-1 font-medium">Pedidos</span>
            </Link>
            <Link 
              to="/ecommerce/products"
              className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive('/ecommerce/products') ? 'text-fiscal-green-600' : 'text-gray-600 hover:text-fiscal-green-600'
              }`}
            >
              <Package size={22} />
              <span className="text-xs mt-1 font-medium">Produtos</span>
            </Link>
            <Link 
              to="/ecommerce/categories"
              className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive('/ecommerce/categories') ? 'text-fiscal-green-600' : 'text-gray-600 hover:text-fiscal-green-600'
              }`}
            >
              <Tags size={22} />
              <span className="text-xs mt-1 font-medium">Categorias</span>
            </Link>
          </div>
        </div>

        {/* Menu Lateral Mobile */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`fixed inset-y-0 right-0 w-72 bg-white transform transition-transform duration-300 shadow-xl rounded-l-2xl ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-white to-gray-50">
              <h2 className="font-bold text-lg">Menu</h2>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 70px)'}}>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/ecommerce"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <ShoppingBag size={18} className="mr-3" />
                    <span>Ver Loja</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/dashboard') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <BarChart size={18} className="mr-3" />
                    <span>Visão Geral</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/orders') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <FileText size={18} className="mr-3" />
                    <span>Pedidos (Kanban)</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/products') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <Package size={18} className="mr-3" />
                    <span>Produtos</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/categories') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <Tags size={18} className="mr-3" />
                    <span>Categorias</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/customers"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/customers') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <Users size={18} className="mr-3" />
                    <span>Clientes</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ecommerce/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive('/ecommerce/settings') 
                        ? 'bg-fiscal-green-50 text-fiscal-green-700 border border-fiscal-green-200 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-100'
                    }`}
                  >
                    <Settings size={18} className="mr-3" />
                    <span>Configurações da Loja</span>
                  </Link>
                </li>
                <li className="border-t border-gray-200 mt-4 pt-4">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-100 transition-all duration-200"
                  >
                    <LogOut size={18} className="mr-3" />
                    <span>Sair</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EcommerceDashboardLayout; 