import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Printer, Check, Plus, Settings, AlertTriangle, ListChecks, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PrinterTabs from '@/components/PrinterTabs';
import { PrintService, PrintRequest } from '@/services/PrintService.js';
import { isMobileDevice } from '@/utils/deviceUtils';
import { NotesService } from '@/services/notesService';
import { useAuth } from '@/contexts/AuthContext';

const Print: React.FC = () => {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [printQueue, setPrintQueue] = useState<PrintRequest[]>([]);
  const [isPrintingStation, setIsPrintingStation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const requests = await PrintService.getPendingPrintRequests();
      // Filtrar para garantir que note_data exista e não seja nulo
      setPrintQueue(requests.filter(req => req.note_data));
    } catch (error) {
      console.error("Erro ao buscar fila de impressão:", error);
      toast({
        title: 'Erro ao buscar fila',
        description: 'Não foi possível carregar os pedidos de impressão pendentes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Processar o ID da rota quando disponível
  useEffect(() => {
    if (id && user) {
      const loadAndProcessNote = async () => {
        try {
          setIsLoading(true);
          // Buscar a nota pelo ID
          const note = await NotesService.getNoteById(id, user.id);
          
          if (!note) {
            toast({
              title: 'Nota não encontrada',
              description: 'A nota fiscal solicitada não foi encontrada.',
              variant: 'destructive',
            });
            navigate('/print');
            return;
          }
          
          // Preparar os dados para impressão
          const noteDataForPrint = {
            id: note.id,
            noteNumber: note.noteNumber,
            date: note.date,
            products: note.products,
            customerData: note.customerData,
            paymentData: note.paymentData,
            totalValue: note.totalValue,
            status: note.status,
            sellerName: note.sellerName || user.user_metadata?.name || user.email,
            ownerId: user.id
          };
          
          // Enviar para a fila de impressão
          try {
            // Tentativa de usar addPrintRequest se disponível, caso contrário usar sendPrintRequest
            let request;
            if (typeof PrintService.addPrintRequest === 'function') {
              request = await PrintService.addPrintRequest(noteDataForPrint);
            } else {
              request = await PrintService.sendPrintRequest(id, noteDataForPrint, user.id);
            }
            
            if (request) {
              toast({
                title: 'Adicionado à fila',
                description: `A nota fiscal #${note.noteNumber} foi adicionada à fila de impressão.`,
                variant: 'success',
              });
              
              // Atualizar a fila para mostrar o novo item
              await fetchPendingRequests();
            } else {
              toast({
                title: 'Erro',
                description: 'Não foi possível adicionar à fila de impressão.',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error("Erro ao processar impressão direta:", error);
            toast({
              title: 'Erro',
              description: 'Ocorreu um erro ao tentar processar esta impressão.',
              variant: 'destructive',
            });
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      loadAndProcessNote();
    } else {
      // Se não há ID na rota, apenas carregar a fila normal
    fetchPendingRequests();
    }
  }, [id, user, toast, navigate, fetchPendingRequests]);

  // Efeito para escutar novas solicitações de impressão se for uma estação de impressão
  useEffect(() => {
    if (isPrintingStation && !isMobileDevice()) {
      console.log('Modo Estação de Impressão ATIVADO');
      const subscription = PrintService.subscribeToNewPrintRequests(async (newRequest) => {
        if (newRequest.note_data) { // Verificar se note_data existe
          toast({
            title: 'Nova Solicitação de Impressão',
            description: `Recebido pedido para nota ID: ${newRequest.note_id}. Processando...`,
          });
          // Adiciona à fila local para visualização e possível processamento manual se necessário
          setPrintQueue(prevQueue => [newRequest, ...prevQueue.filter(req => req.id !== newRequest.id)]);
          // Tenta processar automaticamente
          await processPrintRequest(newRequest);
        } else {
          console.warn('Nova solicitação de impressão recebida sem note_data:', newRequest);
          toast({
            title: 'Solicitação Inválida',
            description: `Pedido ${newRequest.note_id} não contém dados para impressão.`,
            variant: 'destructive',
          });
          // Marcar como erro se os dados forem essenciais e estiverem faltando
          await PrintService.markAsError(newRequest.id!, 'Dados da nota ausentes ou inválidos');
        }
      });

      // Cleanup da inscrição ao desmontar o componente ou desativar o modo estação
      return () => {
        console.log('Modo Estação de Impressão DESATIVADO');
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    }
  }, [isPrintingStation, toast]);

  const processPrintRequest = async (request: PrintRequest) => {
    if (!request.note_data) {
      console.error('Tentativa de imprimir solicitação sem note_data:', request);
      toast({
        title: 'Erro de Impressão',
        description: `Dados da nota #${request.note_id} estão ausentes.`,
        variant: 'destructive',
      });
      await PrintService.markAsError(request.id!, 'Dados da nota ausentes para impressão.');
      fetchPendingRequests(); // Atualiza a fila
      return;
    }
  
    // Aqui entraria a lógica real de impressão.
    // Por enquanto, vamos simular e usar window.print()
    // Você precisará formatar request.note_data para um HTML imprimível
    // ou enviar os comandos corretos para sua impressora fiscal.

    console.log('Processando impressão para:', request.note_data);
    toast({
      title: 'Imprimindo...',
      description: `Preparando nota ID: ${request.note_id}.`,
    });

    // Simulação de formatação e impressão
    // Em um caso real, você abriria uma nova janela com o conteúdo formatado
    // ou usaria uma biblioteca de impressão direta se disponível.
    const printContent = JSON.stringify(request.note_data, null, 2); // Exemplo simples
    const printableWindow = window.open('', '_blank');
    if (printableWindow) {
      printableWindow.document.write(`<pre>${printContent}</pre>`);
      printableWindow.document.close();
      printableWindow.focus();
      // A impressão real pode ser problemática para automatizar completamente sem interação do usuário
      // ou APIs específicas da impressora. window.print() geralmente requer confirmação.
      // printableWindow.print(); 
      // printableWindow.close(); 
      // Para automação real, considerar WebUSB, Electron com Node.js para acesso ao sistema,
      // ou um serviço de impressão dedicado.
      
      // Por agora, vamos apenas simular que a impressão foi acionada.
      // Em um cenário real, você esperaria o resultado da impressão (sucesso/falha).
      console.log("Janela de impressão preparada. Acione a impressão manualmente na nova janela se necessário.");

      // Simulando sucesso após um tempo
      setTimeout(async () => {
        const success = await PrintService.markAsPrinted(request.id!);
        if (success) {
          toast({
            title: 'Impressão Concluída',
            description: `Nota ID: ${request.note_id} marcada como impressa.`,
          });
        } else {
          toast({
            title: 'Erro ao Marcar',
            description: `Falha ao marcar nota ID: ${request.note_id} como impressa.`,
            variant: 'destructive',
          });
        }
        fetchPendingRequests(); // Atualiza a fila
      }, 5000); // Simula tempo de impressão
    } else {
      await PrintService.markAsError(request.id!, 'Falha ao abrir janela de impressão');
      toast({
        title: 'Erro de Impressão',
        description: 'Não foi possível abrir a janela de impressão.',
        variant: 'destructive',
      });
      fetchPendingRequests(); // Atualiza a fila
    }
  };

  const handleManualPrint = async (request: PrintRequest) => {
    if (isMobileDevice()) {
      toast({
        title: 'Ação não permitida',
        description: 'A impressão direta de itens da fila é para estações de impressão desktop.',
        variant: 'default',
      });
      return;
    }
    await processPrintRequest(request);
  };

  const handleMarkAsError = async (requestId: string) => {
    const success = await PrintService.markAsError(requestId, 'Marcado como erro manualmente');
    if (success) {
      toast({
        title: 'Status Atualizado',
        description: `O pedido #${requestId} foi marcado com erro.`,
      });
      fetchPendingRequests();
    } else {
      toast({
        title: 'Erro ao Marcar',
        description: `Falha ao marcar pedido #${requestId} com erro.`,
        variant: 'destructive',
      });
    }
  };
  
  // Removido handleMarkPrinted, pois processPrintRequest já faz isso.
  // const handleMarkPrinted = (id: string) => { ... }

  return (
    <Layout>
      <div className="space-y-4 max-w-full px-2 sm:px-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-cascadia">Gerenciador de Impressão</h1>
          {!isMobileDevice() && (
            <button
              onClick={() => setIsPrintingStation(!isPrintingStation)}
              className={`btn ${isPrintingStation ? 'bg-red-500 hover:bg-red-600' : 'btn-primary'} py-2 px-3 sm:px-4 flex items-center text-xs sm:text-sm whitespace-nowrap`}
            >
              {isPrintingStation ? <AlertTriangle size={16} className="mr-1 sm:mr-2" /> : <Printer size={16} className="mr-1 sm:mr-2" />}
              {isPrintingStation ? 'Parar Estação' : 'Ativar Estação'}
            </button>
          )}
        </div>
        
        {isPrintingStation && !isMobileDevice() && (
          <div className="p-3 sm:p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md text-blue-700 text-sm">
            <p>Modo <strong>Estação de Impressão</strong> ativado. Novas solicitações de impressão serão processadas automaticamente.</p>
          </div>
        )}

        <div className="card p-3 sm:p-4">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-cascadia">Fila de Impressão</h2>
            <button
              onClick={fetchPendingRequests}
              className="btn btn-sm btn-outline flex items-center text-xs"
              disabled={isLoading}
            >
              <ListChecks size={14} className="mr-1" />
              Atualizar
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="loading loading-spinner text-primary"></div>
            </div>
          ) : printQueue.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/4">
                          Nota
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/4">
                          Cliente
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Valor
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/4">
                          Ações
                        </th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {printQueue.map(request => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">
                            #{request.note_data?.noteNumber || request.note_id}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
                            {request.note_data?.customerData?.name || 'Cliente não especificado'}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                            {request.note_data?.totalValue 
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(request.note_data.totalValue) 
                              : '-'}
                      </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs whitespace-nowrap">
                            <div className="flex justify-end gap-1 sm:gap-2 items-center">
                            <button
                                onClick={() => handleManualPrint(request)}
                                className="btn btn-xs btn-ghost text-blue-600 hover:text-blue-800"
                                title="Imprimir"
                            >
                                <Printer size={16} />
                            </button>
                             <button
                                onClick={() => handleMarkAsError(request.id!)}
                                className="btn btn-xs btn-ghost text-red-600 hover:text-red-800"
                                title="Marcar com erro"
                            >
                                <X size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma solicitação de impressão pendente.</p>
              <p className="text-sm text-gray-400 mt-2">
                As novas solicitações aparecerão aqui.
              </p>
            </div>
          )}
        </div>
        
        {isMobileDevice() && (
          <div className="card p-3 sm:p-4 bg-yellow-50 border border-yellow-200 mb-4">
            <h3 className="text-md font-medium text-yellow-800 mb-2 flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              Nota sobre impressão em dispositivos móveis
            </h3>
            <p className="text-sm text-yellow-700">
              A impressão direta não está disponível em dispositivos móveis. Use esta tela para verificar o status das impressões e gerenciar a fila.
            </p>
            </div>
        )}
            
          <PrinterTabs />
      </div>
    </Layout>
  );
};

export default Print;
