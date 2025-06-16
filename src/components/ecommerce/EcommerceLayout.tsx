import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Users, ShoppingBag, Settings, Package, FileText, BarChart, ShoppingCart, Store } from 'lucide-react';
import Layout from '@/components/Layout';

interface EcommerceLayoutProps {
  children: ReactNode;
}

const EcommerceLayout: React.FC<EcommerceLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Verificar qual rota está ativa
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full">
        {/* Menu lateral do Ecommerce */}
        <aside className="bg-white shadow-md rounded-lg p-4 mb-6 md:mb-0 md:w-64 md:mr-6 flex-shrink-0">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="font-bold text-xl flex items-center">
              <ShoppingCart className="mr-2 text-fiscal-green-600" size={20} />
              Painel do E-commerce
            </h2>
            <Link 
              to="/ecommerce" 
              className="mt-4 flex items-center text-gray-600 text-sm hover:text-fiscal-green-600"
            >
              <ChevronLeft size={16} className="mr-1" />
              Voltar para a loja
            </Link>
          </div>
          
          <nav>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/ecommerce/dashboard"
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive('/ecommerce/dashboard')
                      ? 'bg-fiscal-green-50 text-fiscal-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart size={18} className="mr-2" />
                  <span>Visão Geral</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/ecommerce/orders"
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive('/ecommerce/orders')
                      ? 'bg-fiscal-green-50 text-fiscal-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} className="mr-2" />
                  <span>Pedidos (Kanban)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/ecommerce/products"
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive('/ecommerce/products')
                      ? 'bg-fiscal-green-50 text-fiscal-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package size={18} className="mr-2" />
                  <span>Produtos</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/ecommerce/customers"
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive('/ecommerce/customers')
                      ? 'bg-fiscal-green-50 text-fiscal-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={18} className="mr-2" />
                  <span>Clientes</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/ecommerce/settings"
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive('/ecommerce/settings')
                      ? 'bg-fiscal-green-50 text-fiscal-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={18} className="mr-2" />
                  <span>Configurações da Loja</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Conteúdo principal */}
        <div className="flex-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EcommerceLayout; 