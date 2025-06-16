import React from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';

const EcommerceCustomers: React.FC = () => {
  return (
    <EcommerceDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Clientes do E-commerce</h1>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <h3 className="font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-sm">
            A gestão completa de clientes está em desenvolvimento. Em breve você poderá visualizar, pesquisar e gerenciar 
            todos os clientes da sua loja online.
          </p>
        </div>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceCustomers; 