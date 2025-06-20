
import React from 'react';
import { BarChart, TrendingUp, Users, DollarSign, Package } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Visualize dados e métricas do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
              <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produtos</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crescimento</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <BarChart className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Relatórios Disponíveis</h2>
        </div>
        <div className="text-center py-12">
          <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Relatórios em desenvolvimento</p>
          <p className="text-sm text-gray-400 mt-2">Em breve você poderá visualizar relatórios detalhados aqui</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
