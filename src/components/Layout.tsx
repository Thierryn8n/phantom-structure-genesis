import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Printer, LogOut, Menu, ChevronLeft, ChevronRight, Settings, Users, BarChart, Package, Download, X, UserCog, ShoppingBag, ShoppingCart, User, Mail } from 'lucide-react';
import Logo from './ui/Logo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsService } from '@/services/settings.service';
import { EcommerceSettings } from '@/types/settings';


interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ecommerceDropdownOpen, setEcommerceDropdownOpen] = useState(false);
  const [ecommerceSettings, setEcommerceSettings] = useState<EcommerceSettings>({ enabled: false, admin_panel_enabled: false });

  // Check for authentication and load ecommerce settings
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/');
      } else {
        // Load ecommerce settings
        const settings = await SettingsService.getUserSettings();
        if (settings?.ecommerce_settings) {
          setEcommerceSettings(settings.ecommerce_settings);
        }
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      }
    });
    
    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true');
    }
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Toggle ecommerce dropdown
  const toggleEcommerceDropdown = () => {
    setEcommerceDropdownOpen(!ecommerceDropdownOpen);
  };

  // Check if the current route matches the menu item
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Check if any ecommerce panel route is active
  const isEcommercePanelActive = () => {
    const ecommercePaths = ['/ecommerce/customers', '/ecommerce/orders', '/ecommerce/settings'];
    return ecommercePaths.some(path => location.pathname.startsWith(path));
  };

  // Additional useEffect to open the dropdown if an ecommerce panel route is active
  useEffect(() => {
    if (isEcommercePanelActive()) {
      setEcommerceDropdownOpen(true);
    }
  }, [location.pathname]);

  // Listen for ecommerce settings changes
  useEffect(() => {
    const handleStorageChange = async () => {
      const settings = await SettingsService.getUserSettings();
      if (settings?.ecommerce_settings) {
        setEcommerceSettings(settings.ecommerce_settings);
      }
    };

    // Listen for custom event when settings are updated
    window.addEventListener('ecommerceSettingsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('ecommerceSettingsUpdated', handleStorageChange);
    };
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <aside 
        className={`h-screen bg-white border-r border-black/10 transition-all duration-300 ease-in-out z-30 hidden md:block ${
          collapsed ? 'w-[70px]' : 'w-[240px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="relative h-16 flex items-center justify-between border-b border-black/10 px-4">
          <div className={`flex items-center transition-all ${collapsed ? 'justify-center w-full' : ''}`}>
            {!collapsed && <Logo />}
            {collapsed && <Logo small />}
          </div>
          <button
            onClick={toggleSidebar}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-8 w-8 rounded-full bg-white border border-black/10 shadow-md flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 focus:outline-none transition-colors z-50"
            aria-label={collapsed ? "Expandir menu" : "Retrair menu"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User Info Section */}
        {!collapsed && user && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-fiscal-green-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 rounded-full flex items-center justify-center shadow-lg">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Bem-vindo!
                </p>
                <div className="flex items-center space-x-1">
                  <Mail size={12} className="text-fiscal-green-600" />
                  <p className="text-xs text-fiscal-green-700 font-medium truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Collapsed User Avatar */}
        {collapsed && user && (
          <div className="px-2 py-3 border-b border-gray-100 flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 rounded-full flex items-center justify-center shadow-lg">
              <User size={16} className="text-white" />
            </div>
          </div>
        )}

        {/* Sidebar Menu */}
        <nav className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
          <div className="flex-grow py-4">
            <ul className="space-y-1 px-2">
              <li>
                <Link 
                  to="/dashboard" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/dashboard') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <Home size={20} className={`transition-transform duration-200 ${isActive('/dashboard') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Início</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/notes" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/notes') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <FileText size={20} className={`transition-transform duration-200 ${isActive('/notes') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Notas Fiscais</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/notes/new" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/notes/new') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <FileText size={20} className={`transition-transform duration-200 ${isActive('/notes/new') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Nova Nota</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/products-system" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/products-system') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <Package size={20} className={`transition-transform duration-200 ${isActive('/products-system') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Produtos</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/print" 
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-md ${
                    isActive('/print') 
                      ? 'bg-fiscal-green-50 text-fiscal-green-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Printer size={20} className={isActive('/print') ? 'text-fiscal-green-500' : ''} />
                  {!collapsed && <span className="ml-3">Impressão</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/customers" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/customers') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <Users size={20} className={`transition-transform duration-200 ${isActive('/customers') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Clientes</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/sellers" 
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-md ${
                    isActive('/sellers') 
                      ? 'bg-fiscal-green-50 text-fiscal-green-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserCog size={20} className={isActive('/sellers') ? 'text-fiscal-green-500' : ''} />
                  {!collapsed && <span className="ml-3">Vendedores</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/reports') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <BarChart size={20} className={`transition-transform duration-200 ${isActive('/reports') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Relatórios</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive('/settings') 
                      ? 'bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 text-white shadow-lg shadow-fiscal-green-500/25' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <Settings size={20} className={`transition-transform duration-200 ${isActive('/settings') ? 'text-white' : 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="ml-3 font-medium">Configurações</span>}
                </Link>
              </li>
              {/* E-commerce links - só aparecem se o e-commerce estiver habilitado */}
              {ecommerceSettings.enabled && (
                <>
                  <li className="mt-2 pt-2 border-t border-gray-200">
                    <Link 
                      to="/ecommerce" 
                      className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-md ${
                        isActive('/ecommerce') && !location.pathname.startsWith('/ecommerce-admin/dashboard')
                          ? 'bg-fiscal-green-50 text-fiscal-green-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ShoppingBag size={20} className={isActive('/ecommerce') && !location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'text-fiscal-green-500' : ''} />
                      {!collapsed && <span className="ml-3">Ver Loja</span>}
                    </Link>
                  </li>
                  {ecommerceSettings.admin_panel_enabled && (
                    <li className="mt-1">
                      <Link
                        to="/ecommerce-admin/dashboard"
                        className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-md ${
                          location.pathname.startsWith('/ecommerce-admin/dashboard')
                            ? 'bg-fiscal-green-50 text-fiscal-green-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ShoppingCart size={20} className={location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'text-fiscal-green-500' : ''} />
                        {!collapsed && <span className="ml-3">Dashboard E-commerce</span>}
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
          
          <div className="mt-auto pb-4 border-t border-gray-200 pt-4">
            <ul className="space-y-1 px-2">
              <li>
                <button 
                  onClick={handleLogout}
                  className={`group w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-md hover:scale-[1.02] border border-red-200 hover:border-red-300`}
                >
                  <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
                  {!collapsed && <span className="ml-3 font-medium">Sair</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
        
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
        {/* Mobile Header */}
        <header className="bg-black text-white py-2 px-4 md:hidden flex items-center justify-between">
          <div className="flex items-center">
            <Logo />
            <h1 className="ml-3 text-xl font-cascadia">Fiscal Flow</h1>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>
          
        {/* Content Area */}
        <div className="flex-1 overflow-auto flex flex-col min-h-[calc(100vh-56px)]">
          <div className="flex-grow container mx-auto py-6 px-4 mb-16 md:mb-0">
            {children}
          </div>
            
          <footer className="bg-black text-white py-4 text-center mt-auto hidden md:block">
            <div className="container mx-auto">
              <p className="text-sm">
                © {new Date().getFullYear()} Fiscal Flow Notes. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </div>
        
        {/* Mobile Floating Menu - Visible only on mobile */}
        <nav className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 md:hidden shadow-lg rounded-t-xl ${
          mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
        } transition-transform duration-300 ease-in-out`}>
          <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Menu</h3>
              <button onClick={toggleMobileMenu} className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Indicador de arraste */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              <li>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/dashboard') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home size={20} className={`mr-3 ${isActive('/dashboard') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Início</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/notes" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/notes') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText size={20} className={`mr-3 ${isActive('/notes') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Notas Fiscais</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/notes/new" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/notes/new') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText size={20} className={`mr-3 ${isActive('/notes/new') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Nova Nota</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/products-system" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/products-system') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package size={20} className={`mr-3 ${isActive('/products-system') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Produtos</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/print" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/print') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Printer size={20} className={`mr-3 ${isActive('/print') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Impressão</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/customers" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/customers') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={20} className={`mr-3 ${isActive('/customers') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Clientes</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/sellers" 
                  className={`flex items-center px-4 py-3.5 ${isActive('/sellers') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserCog size={20} className={`mr-3 ${isActive('/sellers') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Vendedores</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3.5 ${isActive('/reports') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                >
                  <BarChart size={20} className={`mr-3 ${isActive('/reports') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Relatórios</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3.5 ${isActive('/settings') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                >
                  <Settings size={20} className={`mr-3 ${isActive('/settings') ? 'text-fiscal-green-500' : ''}`} />
                  <span>Configurações</span>
                </Link>
              </li>
              {/* E-commerce links no menu móvel - só aparecem se o e-commerce estiver habilitado */}
              {ecommerceSettings.enabled && (
                <>
                  <li className="border-t border-gray-100 pt-1">
                    <Link 
                      to="/ecommerce" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3.5 ${isActive('/ecommerce') && !location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}
                    >
                      <ShoppingBag size={20} className={`mr-3 ${isActive('/ecommerce') && !location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'text-fiscal-green-500' : ''}`} />
                      <span>Ver Loja</span>
                    </Link>
                  </li>
                  {ecommerceSettings.admin_panel_enabled && (
                    <li>
                      <div className={`px-4 py-3.5 ${location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'bg-fiscal-green-50 text-fiscal-green-700' : 'text-gray-700'}`}>
                        <Link 
                          to="/ecommerce-admin/dashboard" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="font-medium flex items-center"
                        >
                          <ShoppingCart size={18} className={`mr-2 ${location.pathname.startsWith('/ecommerce-admin/dashboard') ? 'text-fiscal-green-500' : ''}`} />
                          Dashboard E-commerce
                        </Link>
                        <ul className="ml-6 space-y-2 mt-2">
                          <li>
                            <Link 
                              to="/ecommerce-admin/dashboard" 
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                isActive('/ecommerce-admin/dashboard') ? 'bg-fiscal-green-100 text-fiscal-green-700' : 'text-gray-700'
                              }`}
                            >
                              <BarChart size={16} className={`mr-2 ${isActive('/ecommerce-admin/dashboard') ? 'text-fiscal-green-500' : ''}`} />
                              <span>Visão Geral</span>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/ecommerce/customers" 
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                isActive('/ecommerce/customers') ? 'bg-fiscal-green-100 text-fiscal-green-700' : 'text-gray-700'
                              }`}
                            >
                              <Users size={16} className={`mr-2 ${isActive('/ecommerce/customers') ? 'text-fiscal-green-500' : ''}`} />
                              <span>Clientes</span>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/ecommerce/orders" 
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                isActive('/ecommerce/orders') ? 'bg-fiscal-green-100 text-fiscal-green-700' : 'text-gray-700'
                              }`}
                            >
                              <FileText size={16} className={`mr-2 ${isActive('/ecommerce/orders') ? 'text-fiscal-green-500' : ''}`} />
                              <span>Pedidos (Kanban)</span>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/ecommerce/products" 
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                isActive('/ecommerce/products') ? 'bg-fiscal-green-100 text-fiscal-green-700' : 'text-gray-700'
                              }`}
                            >
                              <Package size={16} className={`mr-2 ${isActive('/ecommerce/products') ? 'text-fiscal-green-500' : ''}`} />
                              <span>Produtos</span>
                            </Link>
                          </li>
                          <li>
                            <Link 
                              to="/ecommerce/settings" 
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                isActive('/ecommerce/settings') ? 'bg-fiscal-green-100 text-fiscal-green-700' : 'text-gray-700'
                              }`}
                            >
                              <Settings size={16} className={`mr-2 ${isActive('/ecommerce/settings') ? 'text-fiscal-green-500' : ''}`} />
                              <span>Configurações de Loja</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                  )}
                </>
              )}
              <li>
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3.5 text-red-500"
                >
                  <LogOut size={20} className="mr-3" />
                  <span>Sair</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
        

        
        {/* Botão Flutuante para Menu Mobile */}
        {!mobileMenuOpen && (
          <button
            onClick={toggleMobileMenu}
            className="fixed bottom-6 right-6 z-50 md:hidden bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-fiscal-green-400 focus:ring-opacity-50"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Overlay quando o menu está aberto */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden" 
            onClick={toggleMobileMenu}
          ></div>
        )}
      </main>
    </div>
  );
};

export default Layout;