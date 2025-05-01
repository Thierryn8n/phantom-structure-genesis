
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import ProductSelector, { SelectedProduct } from './ProductSelector';
import CustomerForm, { CustomerData } from './CustomerForm';
import PaymentForm, { PaymentData } from './PaymentForm';
import PrintableNote from './PrintableNote';
import { Printer, Save } from 'lucide-react';

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
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const printableNoteRef = useRef<HTMLDivElement>(null);
  
  // Generate a random note number
  const noteNumber = useRef(`${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`);
  
  // Calculate total value
  const totalValue = products.reduce((sum, product) => sum + product.subtotal, 0);
  
  // Format current date
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  
  const handlePrint = useReactToPrint({
    content: () => printableNoteRef.current,
    onBeforeGetContent: () => {
      // Validation before printing
      if (!customerData.name || products.length === 0) {
        toast({
          title: 'Informações incompletas',
          description: 'Por favor, preencha os dados do cliente e adicione produtos antes de imprimir.',
          variant: 'destructive',
        });
        return Promise.reject('Incomplete data');
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      toast({
        title: 'Nota fiscal enviada para impressão',
        description: 'O orçamento foi enviado para impressão com sucesso.',
      });
    },
    onPrintError: () => {
      toast({
        title: 'Erro ao imprimir',
        description: 'Ocorreu um erro ao tentar imprimir o orçamento.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSave = () => {
    // Validation
    if (!customerData.name || products.length === 0) {
      toast({
        title: 'Informações incompletas',
        description: 'Por favor, preencha os dados do cliente e adicione produtos antes de salvar.',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real implementation, this would save to Supabase
    toast({
      title: 'Orçamento salvo',
      description: 'O orçamento foi salvo com sucesso.',
    });
    
    // For demonstration, log the data
    console.log({
      noteNumber: noteNumber.current,
      date: currentDate,
      products,
      customerData,
      paymentData,
      totalValue,
    });
  };
  
  const togglePreviewMode = () => {
    // Only allow preview if we have products and customer info
    if (!isPreviewMode && (!customerData.name || products.length === 0)) {
      toast({
        title: 'Informações incompletas',
        description: 'Por favor, preencha os dados do cliente e adicione produtos para visualizar a nota.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPreviewMode(!isPreviewMode);
  };
  
  if (isPreviewMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-cascadia">Pré-visualização do Orçamento</h2>
          <div className="space-x-2">
            <button
              onClick={togglePreviewMode}
              className="btn-secondary"
            >
              Voltar para edição
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center"
            >
              <Printer size={18} className="mr-1" />
              Imprimir
            </button>
          </div>
        </div>
        
        <div className="border border-fiscal-gray-300 rounded-md overflow-hidden">
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
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-cascadia">Nova Nota Fiscal de Orçamento</h2>
        <div className="space-x-2">
          <button
            onClick={handleSave}
            className="btn-secondary flex items-center"
          >
            <Save size={18} className="mr-1" />
            Salvar
          </button>
          <button
            onClick={togglePreviewMode}
            className="btn-primary flex items-center"
          >
            <Printer size={18} className="mr-1" />
            Visualizar e Imprimir
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductSelector onProductsChange={setProducts} />
        </div>
        
        <div className="space-y-6">
          <CustomerForm onCustomerDataChange={setCustomerData} />
          <PaymentForm totalValue={totalValue} onPaymentDataChange={setPaymentData} />
        </div>
      </div>
      
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
