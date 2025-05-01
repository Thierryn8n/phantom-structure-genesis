
import React from 'react';
import Layout from '@/components/Layout';
import { Printer, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Print: React.FC = () => {
  const { toast } = useToast();

  // Mock print queue data
  const printQueue = [
    { id: '1', customer: 'João Silva', date: '01/05/2025', status: 'pending' },
    { id: '2', customer: 'Maria Oliveira', date: '30/04/2025', status: 'pending' },
  ];
  
  const handlePrint = (id: string) => {
    // In a real implementation, this would trigger the printing process
    toast({
      title: 'Impressão iniciada',
      description: `O orçamento #${id} está sendo enviado para a impressora.`,
    });
  };
  
  const handleMarkPrinted = (id: string) => {
    // In a real implementation, this would mark the note as printed in the database
    toast({
      title: 'Status atualizado',
      description: `O orçamento #${id} foi marcado como impresso.`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-cascadia">Gerenciador de Impressão</h1>
        
        <div className="card">
          <h2 className="text-xl font-cascadia mb-4">Fila de Impressão</h2>
          
          {printQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-fiscal-gray-200">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {printQueue.map((item) => (
                    <tr key={item.id} className="border-b border-fiscal-gray-200">
                      <td className="py-3">#{item.id}</td>
                      <td className="py-3">{item.customer}</td>
                      <td className="py-3">{item.date}</td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrint(item.id)}
                            className="btn-primary py-1 px-3 flex items-center text-sm"
                          >
                            <Printer size={16} className="mr-1" />
                            Imprimir
                          </button>
                          <button
                            onClick={() => handleMarkPrinted(item.id)}
                            className="btn-secondary py-1 px-3 flex items-center text-sm"
                          >
                            <Check size={16} className="mr-1" />
                            Marcar como Impresso
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-fiscal-gray-500">Nenhum orçamento na fila de impressão.</p>
          )}
        </div>
        
        <div className="card">
          <h2 className="text-xl font-cascadia mb-4">Configuração da Impressora</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Impressora Selecionada</label>
              <select className="form-input">
                <option>Impressora Térmica - Epson TM-T20</option>
                <option>Impressora PDF Virtual</option>
                <option>Adicionar Nova Impressora...</option>
              </select>
            </div>
            
            <div>
              <label className="form-label">Formato do Papel</label>
              <select className="form-input">
                <option>80mm (Padrão para impressoras térmicas)</option>
                <option>A4</option>
                <option>Carta</option>
              </select>
            </div>
            
            <button className="btn-primary">
              Salvar Configurações
            </button>
          </div>
        </div>
        
        <div className="bg-fiscal-gray-100 p-4 rounded-md border border-fiscal-gray-200">
          <h3 className="font-medium text-lg mb-2">Dica:</h3>
          <p className="text-fiscal-gray-700">
            Este computador está configurado como o hub central de impressão para todos os vendedores.
            Notas fiscais criadas em dispositivos móveis serão automaticamente sincronizadas e aparecerão na fila de impressão.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Print;
