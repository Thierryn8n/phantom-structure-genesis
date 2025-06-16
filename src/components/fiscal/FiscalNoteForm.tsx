import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import ProductSelector, { SelectedProduct } from './ProductSelector';
import CustomerForm, { CustomerData } from './CustomerForm';
import PaymentForm, { PaymentData } from './PaymentForm';
import PrintableNote from './PrintableNote';
import { Printer, Save, ArrowLeft, Check, Clock, FileText, Smartphone, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { PrintService } from '@/services/PrintService.js';
import { useAuth } from '@/contexts/AuthContext';
import { NotesService } from '@/services/notesService';
import { CustomersService } from '@/services/customersService';
import { FiscalNote, NoteStatus } from '@/types/FiscalNote';

const FiscalNoteForm: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    phone: '',
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'cash',
    installments: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reference to save customer method
  const saveCustomerRef = useRef<(() => void) | null>(null);
  
  // State for mobile accordion sections
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printableNoteRef = useRef<HTMLDivElement>(null);
  const { isMobile, isDesktop } = useDeviceDetect();
  const { user } = useAuth();
  
  // Default printer configuration
  const defaultPrinter = "HP DESKJET 2700 SERIES";
  
  // Generate a random note number
  const noteNumber = useRef(`${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`);
  
  // Current date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate total value
  const totalValue = products.reduce((sum, product) => 
    sum + product.quantity * product.price, 0);
  
  // Check if form is complete
  const isFormComplete = products.length > 0 && customerData.name.trim() !== '';
  
  // Functions to toggle accordion sections
  const toggleProductsSection = () => setProductsExpanded(!productsExpanded);
  const toggleCustomerSection = () => setCustomerExpanded(!customerExpanded);
  const togglePaymentSection = () => setPaymentExpanded(!paymentExpanded);
  
  // Toggle preview mode
  const togglePreviewMode = () => {
    if (!isFormComplete) {
      toast({
        title: 'Informações incompletas',
        description: 'Por favor, preencha os dados do cliente e adicione produtos antes de prosseguir.',
        variant: 'warning',
      });
      return;
    }
    
    // Save customer data if callback exists
    if (saveCustomerRef.current) {
      saveCustomerRef.current();
    }
    
    setIsPreviewMode(!isPreviewMode);
  };
  
  // Adicionar estado para armazenar o ID da nota
  const noteId = useRef<string | undefined>(undefined);
  
  // Função para salvar cliente automaticamente se não tiver sido salvo explicitamente
  const ensureCustomerSaved = async (): Promise<boolean> => {
    if (!user || !customerData.name || !customerData.phone) {
      return false;
    }

    try {
      // Tentar salvar explicitamente primeiro
      let customerSaved = false;
    if (saveCustomerRef.current) {
        try {
          await saveCustomerRef.current();
          customerSaved = true;
          console.log('Cliente salvo explicitamente');
        } catch (error) {
          console.error('Erro ao salvar cliente explicitamente:', error);
        }
      }

      // Se não foi salvo explicitamente, salvar automaticamente
      if (!customerSaved) {
        console.log('Tentando salvar cliente automaticamente...');
        const savedCustomer = await CustomersService.findOrCreateCustomer({
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          signature: customerData.signature,
          ownerId: user.id
        });

        if (savedCustomer) {
          console.log('Cliente salvo automaticamente com sucesso:', savedCustomer);
          return true;
        }
      }

      return customerSaved;
    } catch (error) {
      console.error('Erro ao garantir que o cliente seja salvo:', error);
      return false;
    }
  };
  
  // Modificar a função handleSave para usar o NotesService
  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para salvar o orçamento.',
        variant: 'error',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Tentar salvar o cliente primeiro (explicitamente ou automaticamente)
      await ensureCustomerSaved();
      
      // Preparar dados da nota
      const noteData: FiscalNote = {
        id: noteId.current,
        noteNumber: noteNumber.current,
        date: currentDate,
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit || 'un'
        })),
        customerData: {
          name: customerData.name,
          address: customerData.address,
          phone: customerData.phone,
          email: customerData.email || undefined
        },
        paymentData: {
          method: paymentData.method,
          installments: paymentData.installments,
          dueDate: paymentData.dueDate || undefined,
          observation: paymentData.observation || undefined
        },
        totalValue,
        status: 'draft' as NoteStatus,
        ownerId: user.id,
        // O sellerId só será incluído se o usuário for realmente um vendedor
        // caso contrário, será undefined e não será enviado para o banco
        ...(user?.app_metadata?.seller_id ? { sellerId: user.app_metadata.seller_id } : {}),
        sellerName: user.user_metadata?.name || user.email
      };
      
      // Salvar a nota no Supabase
      const savedNote = await NotesService.saveNote(noteData);
      
      if (savedNote) {
    toast({
      title: 'Orçamento salvo',
      description: 'O orçamento foi salvo com sucesso.',
          variant: 'success'
        });
        
        // Atualizar o ID da nota se for uma nova nota
        if (savedNote.id) {
          noteId.current = savedNote.id;
        }
      } else {
        throw new Error('Não foi possível salvar o orçamento');
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o orçamento.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Modificar a função handleUnifiedPrintLogic para manter compatibilidade com o tipo importado
  const handleUnifiedPrintLogic = async () => {
    if (!noteId.current || !user) {
      // Se não tivermos o ID da nota salva, não podemos prosseguir
      console.error("Erro: ID da nota não disponível");
      toast({ title: 'Erro de Sistema', description: 'ID da nota não disponível ou usuário não logado.', variant: 'error' });
      return false;
    }

    // Preparar os dados que serão necessários para a impressão
    const noteDataForPrint = {
      id: noteId.current,
      noteNumber: noteNumber.current,
      date: currentDate,
      products: products.map(product => ({
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        subtotal: product.subtotal,
        unit: product.unit || 'un',
        code: product.code || product.id?.toString()
      })),
      customerData,
      paymentData: { 
        method: paymentData.method, 
        installments: paymentData.installments, 
        // paid: paymentData.paid, // Adicionar se PaymentData suportar
      },
      totalValue,
      status: 'issued', // Ou o status que a nota realmente tem neste ponto
      sellerName: user.user_metadata?.name || user.email,
      ownerId: user.id, // Adicionado para consistência com PrintRequest e FiscalNote
      // Adicionar quaisquer outros campos de FiscalNote que sejam relevantes para a impressão.
    };

    if (isMobile) {
      toast({ title: 'Preparando impressão remota...', description: 'Enviando para a fila de impressão.' });
      try {
        // Usando sendPrintRequest que é o método disponível no PrintService importado
        const request = await PrintService.sendPrintRequest(noteId.current, noteDataForPrint, user.id);
        if (request) {
          toast({ title: 'Enviado para a Fila', description: `O pedido de impressão #${request.id} foi enviado.`, variant: 'success' });
          // A nota fiscal em 'fiscal_notes' já foi marcada como 'issued'.
          // O PrintService cuidará de marcar o 'print_request' como 'printed' quando a estação de impressão o fizer.
          return true;
        } else {
          toast({ title: 'Falha ao Enviar', description: 'Não foi possível enviar o pedido para a fila de impressão.', variant: 'error' });
          return false;
        }
      } catch (error) {
        console.error("Erro ao enviar para fila de impressão:", error);
        toast({ title: 'Erro de Rede', description: 'Falha ao comunicar com o serviço de impressão.', variant: 'error' });
        return false;
      }
    } else { // Desktop
      toast({ title: 'Preparando impressão local...', description: 'A janela de impressão será aberta em breve.' });
      // A função handlePrint (react-to-print) será chamada externamente após esta função retornar true.
      // Ela já tem a lógica para, após a impressão, chamar NotesService.markAsPrinted.
      
      // TODO: Considerar enviar para PrintService.sendPrintRequest também no desktop
      // para que uma estação de impressão dedicada (Print.tsx) sempre lide com a impressão física.
      // Isso centralizaria a lógica de comunicação com a impressora.
      // Exemplo:
      // const request = await PrintService.sendPrintRequest(noteId.current, noteDataForPrint, user.id);
      // if (request) { return true; } else { return false; }
      return true; // Sinaliza que a impressão local pode prosseguir
    }
  };
  
  const handlePrint = useReactToPrint({
    content: () => printableNoteRef.current,
    onAfterPrint: async () => {
      if (noteId.current && user) {
        try {
          await NotesService.markAsPrinted(noteId.current, user.id);
          toast({
            title: 'Nota Marcada como Impressa',
            description: 'O status da nota foi atualizado para impresso no sistema.',
            variant: 'success',
          });
        } catch (error) {
          console.error('Erro ao marcar nota como impressa após impressão local:', error);
          toast({
            title: 'Erro ao Atualizar Status',
            description: 'Não foi possível marcar a nota como impressa no sistema após a impressão local.',
            variant: 'error',
          });
        }
      }
    },
  });

  // Modificar a função handlePrintAfterSave para usar a lógica unificada
  const handlePrintAfterSave = async () => {
    // Primeiro, garantimos que a nota seja salva (ou atualizada se já existir)
    await handleSave(); 
    
    // Verificamos se temos o ID da nota salva (handleSave atualiza noteId.current)
    if (!noteId.current || !user) {
      // handleSave já deve ter mostrado um toast de erro se falhou ou se o usuário não está logado.
      // Apenas retornamos para evitar prosseguir com a impressão sem ID.
      return;
    }
    
    setIsSubmitting(true); // Feedback visual para o processo de impressão
    const canProceedToPrint = await handleUnifiedPrintLogic();
    setIsSubmitting(false);

    if (canProceedToPrint && !isMobile) {
      // Se for desktop e a lógica unificada permitiu, chama a impressão local.
      handlePrint();
    } else if (canProceedToPrint && isMobile) {
      // Se for mobile, a solicitação já foi enviada para a fila.
      // Nenhuma ação adicional aqui, exceto talvez feedback.
      console.log("Solicitação de impressão enviada para a fila a partir de dispositivo móvel.");
    }
    // Se canProceedToPrint for false, handleUnifiedPrintLogic já mostrou um toast.
  };
  
  const handleSendToPrinter = async () => {
    if (!isFormComplete) {
      toast({
        title: 'Informações incompletas',
        description: 'Por favor, preencha os dados do cliente e adicione produtos antes de prosseguir.',
        variant: 'warning',
      });
      return;
    }

    // Garante que o cliente seja salvo se houver um callback para isso (lógica de CustomerForm)
    if (saveCustomerRef.current) {
      try {
        await saveCustomerRef.current(); // Espera o salvamento do cliente
      } catch (error) {
        console.error("Erro ao salvar cliente antes de enviar para impressora:", error);
        toast({ title: 'Erro ao Salvar Cliente', description: 'Não foi possível salvar os dados do cliente.', variant: 'error' });
        return; // Não prosseguir se o cliente não puder ser salvo
      }
    }
    
    // Agora que o cliente está salvo (ou já estava), salvamos/atualizamos a nota e então imprimimos.
    // handlePrintAfterSave cuida de salvar a nota e depois da lógica de impressão.
    await handlePrintAfterSave();
  };
  
  // Auto-expand sections based on completion
  useEffect(() => {
    if (isMobile) {
      // Inicialmente, expandir apenas a seção de produtos
      if (products.length === 0) {
        setProductsExpanded(true);
        setCustomerExpanded(false);
        setPaymentExpanded(false);
      }
    }
  }, [products.length, isMobile]);
  
  // Efeito para garantir que os produtos selecionados não sejam perdidos ao navegar entre abas
  useEffect(() => {
    // Não é necessário nenhuma ação aqui pois já estamos passando os produtos como initialSelectedProducts
    // E mantendo o estado no componente pai (FiscalNoteForm)
    console.log(`Estado atual: ${products.length} produtos selecionados`);
  }, [products.length]);
  
  // Função para configurar o ref do Customer Form
  const setupCustomerFormRef = (ref: () => void) => {
    saveCustomerRef.current = ref;
  };
  
  // Handle printing button based on device type
  const renderPrintButton = () => {
    if (isPreviewMode) {
      if (isMobile) {
        return (
          <div className="w-full grid grid-cols-1 gap-3">
            <button
              onClick={togglePreviewMode}
              className="w-full bg-white border-2 border-fiscal-gray-300 text-fiscal-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center shadow-sm"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar para Edição
            </button>
            <button
              onClick={handleSendToPrinter}
              disabled={isSubmitting}
              className="w-full bg-fiscal-green-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center shadow-sm disabled:opacity-70"
            >
              <Printer size={18} className="mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar para Fila de Impressão'}
            </button>
          </div>
        );
      }
      
      return (
        <div className="flex flex-row gap-3">
          <button
            onClick={togglePreviewMode}
            className="btn-secondary py-2 px-4 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar para Edição
          </button>
          <button
            onClick={handleSendToPrinter}
            disabled={isSubmitting}
            className="btn-primary py-2 px-4 flex items-center justify-center"
          >
            <Printer size={18} className="mr-2" />
            {isSubmitting ? 'Enviando...' : 'Imprimir Localmente'}
          </button>
        </div>
      );
    }
    
    // Em dispositivo móvel, sempre mostra o botão para enviar ao PC
    if (isMobile) {
      return (
        <button
          onClick={handleSendToPrinter}
          disabled={isSubmitting}
          className="btn-primary rounded-full flex items-center justify-center px-3 sm:px-5 py-1.5 text-sm sm:text-base flex-grow sm:flex-grow-0"
        >
          <Smartphone size={16} className="mr-1" />
          {isSubmitting ? 'Enviando...' : 'Enviar para impressão'}
        </button>
      );
    }
    
    // Em desktop, mostra o botão de impressão direta
    return (
      <button
        onClick={handlePrintAfterSave}
        className="btn-primary rounded-full flex items-center px-5 py-2"
      >
        <Printer size={18} className="mr-1" />
        Imprimir
      </button>
    );
  };
  
  return isPreviewMode ? (
    <div className="max-w-5xl mx-auto p-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        {isMobile ? (
          <div className="mb-6 sticky top-0 z-10 bg-white pb-2">
            <div className="w-full grid grid-cols-1 gap-3">
              <button
                onClick={togglePreviewMode}
                className="w-full bg-white border-2 border-fiscal-gray-300 text-fiscal-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center shadow-sm"
              >
                <ArrowLeft size={18} className="mr-2" />
                Voltar para Edição
              </button>
              <button
                onClick={handleSendToPrinter}
                disabled={isSubmitting}
                className="w-full bg-fiscal-green-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center shadow-sm disabled:opacity-70"
              >
                <Printer size={18} className="mr-2" />
                {isSubmitting ? 'Enviando...' : 'Enviar para Fila de Impressão'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-6">
              <button
                onClick={togglePreviewMode}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </button>
          <div className="flex space-x-3">
            {renderPrintButton()}
          </div>
        </div>
        )}
        
          <PrintableNote
            ref={printableNoteRef}
            noteNumber={noteNumber.current}
            date={currentDate}
            products={products}
            customerData={customerData}
            paymentData={paymentData}
            totalValue={totalValue}
          />
        </div>
      </div>
  ) : (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nova Nota Fiscal</h1>
        <div className="flex space-x-2">
                <button
                  onClick={handleSave}
            disabled={isSubmitting}
            className="btn-secondary rounded-full flex items-center px-4 py-2"
                >
            <Save size={16} className="mr-1" />
            {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={togglePreviewMode}
                  disabled={!isFormComplete}
            className="btn-primary rounded-full flex items-center px-5 py-2"
                >
            <Printer size={16} className="mr-1" />
            Visualizar
                </button>
          </div>
        </div>
        
      {isMobile ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-fiscal-green-50 cursor-pointer"
              onClick={toggleProductsSection}
            >
              <div className="flex items-center gap-2">
                <span className="bg-fiscal-green-500 text-white p-1.5 rounded-lg">
                  <FileText size={16} />
                </span>
                <span className="font-medium">Produtos</span>
                {products.length > 0 && (
                  <span className="bg-fiscal-green-100 text-fiscal-green-800 text-xs rounded-full px-2 py-0.5">
                    {products.length}
                  </span>
                )}
              </div>
              {productsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            <div className={`${productsExpanded ? 'block' : 'hidden'} p-3`}>
                <ProductSelector 
                  onProductsChange={setProducts} 
                initialSelectedProducts={products}
                />
              
              {products.length > 0 && (
                <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
                  <div className="text-sm text-gray-500">
                    {products.length} {products.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
                  </div>
                  <button
                    onClick={() => {
                      setProductsExpanded(false);
                      setCustomerExpanded(true);
                    }}
                    className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center"
                  >
                    Avançar para Cliente
                    <ChevronDown size={16} className="ml-1 transform rotate-270" />
                  </button>
              </div>
            )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-fiscal-green-50 cursor-pointer"
              onClick={toggleCustomerSection}
            >
              <div className="flex items-center gap-2">
                <span className="bg-fiscal-green-500 text-white p-1.5 rounded-lg">
                  <FileText size={16} />
                </span>
                <span className="font-medium">Dados do Cliente</span>
                {customerData.name && (
                  <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5">
                    Preenchido
                  </span>
                )}
              </div>
              {customerExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {customerExpanded && (
              <div className="p-3">
                <CustomerForm 
                  onCustomerDataChange={setCustomerData} 
                  onSaveRef={setupCustomerFormRef}
                />
                
                <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
                  <button
                    onClick={() => {
                      setCustomerExpanded(false);
                      setProductsExpanded(true);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center"
                  >
                    <ChevronDown size={16} className="mr-1 transform -rotate-90" />
                    Voltar aos Produtos
                  </button>
                  
                  <button
                    onClick={() => {
                      setCustomerExpanded(false);
                      setPaymentExpanded(true);
                    }}
                    className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center"
                    disabled={!customerData.name}
                  >
                    Avançar para Pagamento
                    <ChevronDown size={16} className="ml-1 transform rotate-270" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="flex items-center justify-between p-3 bg-fiscal-green-50 cursor-pointer"
              onClick={togglePaymentSection}
            >
              <div className="flex items-center gap-2">
                <span className="bg-fiscal-green-500 text-white p-1.5 rounded-lg">
                  <FileText size={16} />
                </span>
                <span className="font-medium">Pagamento</span>
              </div>
              {paymentExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {paymentExpanded && (
              <div className="p-3">
                <PaymentForm totalValue={totalValue} onPaymentDataChange={setPaymentData} />
                
                <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-4">
                  <button
                    onClick={() => {
                      setPaymentExpanded(false);
                      setCustomerExpanded(true);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center"
                  >
                    <ChevronDown size={16} className="mr-1 transform -rotate-90" />
                    Voltar ao Cliente
                  </button>
                
                  <button
                    onClick={togglePreviewMode}
                    disabled={!isFormComplete}
                    className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                  >
                    <Printer size={18} className="mr-2" />
                    Visualizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-xl font-cascadia mb-4 flex items-center">
              <span className="bg-fiscal-green-100 text-fiscal-green-700 p-1 rounded-lg mr-2">
                <FileText size={18} />
              </span>
              Produtos
            </h3>
            <ProductSelector 
              onProductsChange={setProducts} 
              initialSelectedProducts={products}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-xl font-cascadia mb-4 flex items-center">
              <span className="bg-fiscal-green-100 text-fiscal-green-700 p-1 rounded-lg mr-2">
                <FileText size={18} />
              </span>
              Dados do Cliente
            </h3>
            <CustomerForm 
              onCustomerDataChange={setCustomerData} 
              onSaveRef={setupCustomerFormRef}
            />
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-cascadia mb-4 flex items-center">
              <span className="bg-fiscal-green-100 text-fiscal-green-700 p-1 rounded-lg mr-2">
                <FileText size={18} />
              </span>
              Pagamento
            </h3>
            <PaymentForm totalValue={totalValue} onPaymentDataChange={setPaymentData} />
          </div>
        </div>
      </div>
      
      )}
      
      {/* Hidden printable component */}
      <div className="hidden">
        <PrintableNote
          ref={printableNoteRef}
          noteNumber={noteNumber.current}
          date={currentDate}
          products={products}
          customerData={customerData}
          paymentData={paymentData}
          totalValue={totalValue}
        />
      </div>
    </div>
  );
};

export default FiscalNoteForm;