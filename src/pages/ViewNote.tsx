import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NotesService } from '@/services/notesService';
import { FiscalNote } from '@/types/FiscalNote';
import PrintableNote from '@/components/fiscal/PrintableNote';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Printer, Save, Edit } from 'lucide-react';
import { SelectedProduct } from '@/components/fiscal/ProductSelector';
import { PaymentData } from '@/components/fiscal/PaymentForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ViewNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [note, setNote] = useState<FiscalNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printableNoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        const fetchedNote = await NotesService.getNoteById(id, user.id);
        
        if (fetchedNote) {
          setNote(fetchedNote);
        } else {
          toast({
            title: 'Nota não encontrada',
            description: 'Não foi possível encontrar esta nota fiscal.',
            variant: 'destructive',
          });
          navigate('/notes');
        }
      } catch (error) {
        console.error('Erro ao buscar nota:', error);
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao carregar os dados da nota.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNote();
  }, [id, user, toast, navigate]);

  // Função de impressão
  const handlePrint = useReactToPrint({
    content: () => printableNoteRef.current,
    documentTitle: note ? `Orçamento ${note.noteNumber}` : 'Orçamento',
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      toast({
        title: 'Impressão concluída',
        description: 'O orçamento foi enviado para a impressora.',
      });
      
      // Marcar como impressa após a impressão bem-sucedida
      if (note?.id && user) {
        NotesService.markAsPrinted(note.id, user.id);
      }
    }
  });

  const handleEdit = () => {
    if (note?.id) {
      navigate(`/notes/edit/${note.id}`);
    }
  };

  const handleBack = () => {
    navigate('/notes');
  };

  // Converter os produtos da nota para o formato esperado pelo PrintableNote
  const convertProducts = (noteProducts: any[]): SelectedProduct[] => {
    return noteProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit || 'un',
      code: product.code || product.id.substring(0, 6),
      subtotal: product.price * product.quantity
    }));
  };

  // Converter os dados de pagamento para o formato esperado pelo PrintableNote
  const convertPaymentData = (notePaymentData: any): PaymentData => {
    return {
      total: note ? note.totalValue : 0,
      method: notePaymentData.method as PaymentData['method'],
      installments: notePaymentData.installments,
      otherDetails: notePaymentData.observation,
      // Valores calculados
      appliedFee: 0,
      installmentValue: note ? note.totalValue / notePaymentData.installments : 0,
      totalWithFees: note ? note.totalValue : 0
    };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiscal-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nota não encontrada</h2>
            <p className="text-gray-600 mb-4">A nota fiscal solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
            <button 
              onClick={handleBack}
              className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-5 py-2 rounded-lg flex items-center"
            >
              <ArrowLeft size={18} className="mr-1" />
              Voltar para a lista
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Converter produtos e dados de pagamento antes de renderizar
  const printableProducts = convertProducts(note.products);
  const printablePaymentData = convertPaymentData(note.paymentData);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar para Lista
          </Button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div>
              <span className="text-sm text-gray-500">Número: </span>
              <span className="font-semibold text-gray-800">{note.noteNumber}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Data: </span>
              <span className="font-semibold text-gray-800">{note.date}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status: </span>
              <Badge 
                variant={
                  note.status === 'canceled' ? 'destructive' :
                  note.status === 'draft' ? 'secondary' :
                  'default'
                }
                className="capitalize"
              >
                {note.status === 'draft' && 'Rascunho'}
                {note.status === 'issued' && 'Emitida'}
                {note.status === 'printed' && 'Impressa'}
                {note.status === 'finalized' && 'Finalizada'}
                {note.status === 'canceled' && 'Cancelada'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-end items-center mb-6 space-x-3">
            {note.status === 'draft' && (
              <Button
                variant="default"
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                size="sm"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </Button>
            )}
            <Button
              variant="default"
              onClick={handlePrint}
              className="bg-fiscal-green-600 hover:bg-fiscal-green-700 text-white flex items-center"
              size="sm"
            >
              <Printer size={16} className="mr-2" />
              Imprimir
            </Button>
          </div>
          
          <PrintableNote
            ref={printableNoteRef}
            noteNumber={note.noteNumber}
            date={note.date}
            products={printableProducts}
            customerData={note.customerData}
            paymentData={printablePaymentData}
            totalValue={note.totalValue}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ViewNote; 