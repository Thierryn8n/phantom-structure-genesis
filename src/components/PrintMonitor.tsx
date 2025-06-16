import React, { useState, useEffect, useRef } from 'react';
import { Printer, AlertTriangle, CheckCircle, RefreshCw, Ban, Info, Settings, MinusCircle, Eye, EyeOff, Minimize, Maximize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { PrintService, PrintRequest } from '@/services/printService';
import { useReactToPrint } from 'react-to-print';
import PrintableNote from '@/components/fiscal/PrintableNote';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const PrintMonitor: React.FC = () => {
  const [printRequests, setPrintRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PrintRequest | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const { isDesktop } = useDeviceDetect();
  const printableRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Define a impressora padrão
  const [currentPrinter, setCurrentPrinter] = useState<string>("HP DESKJET 2700 SERIES");
  
  useEffect(() => {
    // Se não for desktop, não carrega o componente
    if (!isDesktop) return;
    
    // Em uma versão futura, podemos buscar a impressora das configurações
    try {
      // Tentar obter a impressora das configurações locais
      const savedPrinter = localStorage.getItem('settings_defaultPrinter');
      if (savedPrinter) {
        setCurrentPrinter(savedPrinter);
      }

      // Carregar estado de minimização das configurações locais
      const savedMinimized = localStorage.getItem('print_monitor_minimized');
      if (savedMinimized !== null) {
        setIsMinimized(savedMinimized === 'true');
      }

      // Carregar estado de visibilidade das configurações locais
      const savedVisible = localStorage.getItem('print_monitor_visible');
      if (savedVisible !== null) {
        setIsVisible(savedVisible === 'true');
      }
    } catch (error) {
      console.error("Erro ao obter configurações:", error);
    }
  }, [isDesktop]);

  // Salvar estado de minimização quando mudar
  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('print_monitor_minimized', String(isMinimized));
    }
  }, [isMinimized, isDesktop]);

  // Salvar estado de visibilidade quando mudar
  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('print_monitor_visible', String(isVisible));
    }
  }, [isVisible, isDesktop]);

  // Busca as solicitações pendentes ao carregar o componente
  useEffect(() => {
    if (!isDesktop) return; // Só executa no desktop
    if (!user) return; // Só executa quando o usuário está autenticado
    if (!isVisible) return; // Não busca se o componente estiver oculto
    
    const fetchPrintRequests = async () => {
      setLoading(true);
      try {
        const requests = await PrintService.getPendingPrintRequests();
        setPrintRequests(requests);
      } catch (error) {
        console.error('Erro ao buscar solicitações de impressão:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível buscar as solicitações de impressão.',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrintRequests();

    // Configura a assinatura para novas solicitações
    const subscription = PrintService.subscribeToNewPrintRequests((request) => {
      setPrintRequests(prev => [...prev, request]);
      
      toast({
        title: 'Nova solicitação de impressão',
        description: `Orçamento #${request.note_id} recebido para impressão.`,
      });
    });

    // Atualiza periodicamente as solicitações
    const interval = setInterval(fetchPrintRequests, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [isDesktop, toast, user, isVisible]);

  // Função para alternar o estado de minimização
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Função para alternar a visibilidade
  const toggleVisibility = () => {
    if (isVisible) {
      // Avisar que o monitor está sendo ocultado
      toast({
        title: 'Monitor de impressão ocultado',
        description: 'Você pode ativar novamente clicando no ícone da impressora na barra inferior.',
      });
    }
    setIsVisible(!isVisible);
  };

  // Função para imprimir
  const handlePrint = useReactToPrint({
    content: () => printableRef.current,
    onBeforeGetContent: () => {
      if (!currentRequest) {
        return Promise.reject('Nenhuma solicitação selecionada');
      }
      
      // Show printer reminder toast
      toast({
        title: 'Seleção de Impressora',
        description: `Use a impressora ${currentPrinter} para melhor qualidade de impressão.`,
      });
      
      return Promise.resolve();
    },
    onAfterPrint: async () => {
      if (currentRequest?.id) {
        await PrintService.markAsPrinted(currentRequest.id);
        setPrintRequests(prev => prev.filter(req => req.id !== currentRequest.id));
        toast({
          title: 'Impressão concluída',
          description: `Orçamento #${currentRequest.note_id} impresso com sucesso.`,
        });
        setCurrentRequest(null);
      }
    },
    onPrintError: async () => {
      if (currentRequest?.id) {
        await PrintService.markAsError(currentRequest.id, 'Erro ao imprimir');
        toast({
          title: 'Erro na impressão',
          description: `Não foi possível imprimir o orçamento #${currentRequest.note_id}.`,
          variant: 'error',
        });
      }
    },
  });

  const printRequest = (request: PrintRequest) => {
    setCurrentRequest(request);
    // Pequeno delay para garantir que o componente foi renderizado
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const cancelRequest = async (requestId: string) => {
    try {
      await PrintService.markAsError(requestId, 'Cancelado pelo usuário');
      setPrintRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'Solicitação cancelada',
        description: 'A solicitação de impressão foi cancelada.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a solicitação.',
        variant: 'error',
      });
    }
  };

  // Se não for desktop ou não houver usuário, não renderiza o componente
  if (!isDesktop || !user) return null;

  // Se o componente estiver oculto, mostrar apenas um botão flutuante para reativá-lo
  if (!isVisible) {
    return (
      <button 
        onClick={toggleVisibility}
        className="fixed bottom-6 right-6 z-50 bg-fiscal-green-500 text-white p-3 rounded-full shadow-lg hover:bg-fiscal-green-600 transition-colors"
        title="Mostrar Monitor de Impressão"
      >
        <Printer size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden md:block">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-80">
        <div className="bg-fiscal-green-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Printer className="mr-2" size={18} />
            <h3 className="font-medium">Monitor de Impressão</h3>
          </div>
          <div className="flex">
            <Link 
              to="/print"
              className="p-1 rounded-full hover:bg-fiscal-green-600 transition-colors mr-1"
              title="Configurações de Impressão"
            >
              <Settings size={16} />
            </Link>
            <button 
              onClick={toggleMinimize}
              className="p-1 rounded-full hover:bg-fiscal-green-600 transition-colors mr-1"
              title={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Maximize size={16} /> : <Minimize size={16} />}
            </button>
            <button 
              onClick={toggleVisibility}
              className="p-1 rounded-full hover:bg-fiscal-green-600 transition-colors mr-1"
              title="Ocultar Monitor"
            >
              <EyeOff size={16} />
            </button>
            <button 
              onClick={async () => {
                setLoading(true);
                const requests = await PrintService.getPendingPrintRequests();
                setPrintRequests(requests);
                setLoading(false);
              }}
              className="p-1 rounded-full hover:bg-fiscal-green-600 transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
        <div className="p-2 bg-fiscal-green-50 border-b border-fiscal-green-200 flex items-center text-sm text-fiscal-green-800">
          <Info size={14} className="mr-1.5" />
              <span>Impressora configurada: {currentPrinter}</span>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {printRequests.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhuma solicitação de impressão pendente.</p>
                  <p className="text-sm mt-1 text-fiscal-gray-400">Acesse Configurações para ativar o Windows.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {printRequests.map((request) => (
                <li key={request.id} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Orçamento #{request.note_id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(request.created_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => printRequest(request)}
                        className="p-1.5 rounded-full bg-fiscal-green-100 text-fiscal-green-600 hover:bg-fiscal-green-200 transition-colors"
                        title="Imprimir"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => cancelRequest(request.id!)}
                        className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Cancelar"
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        )}
      </div>
      
      {/* Componente oculto para impressão */}
      <div className="hidden">
        {currentRequest && (
          <PrintableNote
            ref={printableRef}
            noteNumber={currentRequest.note_data.noteNumber}
            date={currentRequest.note_data.date}
            products={currentRequest.note_data.products}
            customerData={currentRequest.note_data.customerData}
            paymentData={currentRequest.note_data.paymentData}
            totalValue={currentRequest.note_data.totalValue}
          />
        )}
      </div>
    </div>
  );
};

export default PrintMonitor; 