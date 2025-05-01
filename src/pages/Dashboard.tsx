
import React from 'react';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { FileText, Printer, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data for recent quotes
  const recentQuotes = [
    { id: '1', customer: 'João Silva', date: '01/05/2025', value: 199.90 },
    { id: '2', customer: 'Maria Oliveira', date: '30/04/2025', value: 349.50 },
    { id: '3', customer: 'Carlos Santos', date: '29/04/2025', value: 1250.00 },
  ];
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-cascadia">Painel de Controle</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-cascadia mb-4">Ações Rápidas</h2>
            
            <div className="space-y-4">
              <Link
                to="/notes/new"
                className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Nova Nota Fiscal</h3>
                    <p className="text-sm text-fiscal-gray-600">Criar um novo orçamento</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-fiscal-gray-400" />
              </Link>
              
              <Link
                to="/print"
                className="flex items-center justify-between p-4 border border-black rounded-md hover:bg-fiscal-gray-50 hover:border-fiscal-green-500 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-fiscal-green-500 rounded-md mr-3">
                    <Printer size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Impressão</h3>
                    <p className="text-sm text-fiscal-gray-600">Gerenciar impressões pendentes</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-fiscal-gray-400" />
              </Link>
            </div>
          </div>
          
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-cascadia">Orçamentos Recentes</h2>
              <Link to="/notes" className="text-sm text-fiscal-green-600 hover:text-fiscal-green-800">
                Ver todos
              </Link>
            </div>
            
            {recentQuotes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-fiscal-gray-200">
                      <th className="pb-2">Cliente</th>
                      <th className="pb-2">Data</th>
                      <th className="pb-2 text-right">Valor</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuotes.map((quote) => (
                      <tr key={quote.id} className="border-b border-fiscal-gray-200 hover:bg-fiscal-gray-50">
                        <td className="py-3">{quote.customer}</td>
                        <td className="py-3">{quote.date}</td>
                        <td className="py-3 text-right">R$ {quote.value.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <Link 
                            to={`/notes/${quote.id}`} 
                            className="text-fiscal-green-600 hover:text-fiscal-green-800"
                          >
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-fiscal-gray-500">Nenhum orçamento recente.</p>
            )}
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-cascadia mb-4">Status da Sincronização</h2>
          <div className="p-4 bg-fiscal-green-50 border border-fiscal-green-200 rounded-md">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-fiscal-green-500 rounded-full mr-2"></div>
              <p className="text-fiscal-green-800">Todos os dados estão sincronizados</p>
            </div>
            <p className="text-sm text-fiscal-gray-600 mt-1">
              Última sincronização: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
