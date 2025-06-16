import React from 'react';
import EcommerceDashboardLayout from '@/components/ecommerce/EcommerceDashboardLayout';

const EcommerceOrders: React.FC = () => {
  return (
    <EcommerceDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Pedidos (Kanban)</h1>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          <h3 className="font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-sm">
            O sistema de gestão de pedidos com visualização Kanban está em desenvolvimento. Em breve você poderá 
            acompanhar e gerenciar os pedidos em diferentes estágios (Novo, Em processamento, Enviado, Entregue, etc).
          </p>
        </div>
      </div>
    </EcommerceDashboardLayout>
  );
};

export default EcommerceOrders; 