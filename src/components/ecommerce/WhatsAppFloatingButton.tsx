import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, X, User, Loader2 } from 'lucide-react'; // MessageSquare para ícone do WhatsApp

interface Seller {
  id: string;
  full_name: string;
  phone: string;
  // avatar_url?: string; // Opcional: para mostrar uma foto do vendedor
}

const WhatsAppFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sellers.length === 0) { 
      const fetchSellers = async () => {
        setIsLoading(true);
        setError(null);
        try {
          try {
            const { data: activeSellers, error: activeError } = await supabase
              .from('sellers')
              .select('id, full_name, phone')
              .eq('active', true)
              .order('full_name', { ascending: true });

            if (activeError && activeError.code === '42703') { 
              console.warn("Coluna 'active' não encontrada na tabela 'sellers'. Buscando todos os vendedores.");
              const { data: allSellers, error: allError } = await supabase
                .from('sellers')
                .select('id, full_name, phone')
                .order('full_name', { ascending: true });
              if (allError) throw allError;
              setSellers(allSellers || []);
            } else if (activeError) {
              throw activeError;
            } else {
              setSellers(activeSellers || []);
            }
          } catch (innerError: any) {
            console.error("Erro ao tentar filtrar por 'active', buscando todos: ", innerError.message);
            const { data, error: fetchError } = await supabase
              .from('sellers')
              .select('id, full_name, phone')
              .order('full_name', { ascending: true });

            if (fetchError) {
              throw fetchError;
            }
            setSellers(data || []);
          }
        } catch (err: any) {
          console.error('Erro ao buscar vendedores:', err);
          setError('Não foi possível carregar os vendedores. Tente novamente.');
          setSellers([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSellers();
    }
  }, [isOpen, sellers.length]); // Dependência atualizada

  const handleSellerClick = (whatsappNumber: string) => {
    const cleanedNumber = whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanedNumber}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false); 
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg z-[35] transition-transform duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        aria-label="Contatar vendedor via WhatsApp"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 right-6 mb-2 w-72 bg-white rounded-lg shadow-xl z-[35] border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-lg text-center">Fale com um especialista</h3>
          </div>
          
          {isLoading && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[100px]">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">Carregando vendedores...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 text-center text-red-600 bg-red-50 border-t border-red-200">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!isLoading && !error && sellers.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Nenhum vendedor disponível no momento.</p>
            </div>
          )}

          {!isLoading && !error && sellers.length > 0 && (
            <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {sellers.map((seller) => (
                <li key={seller.id}>
                  <button
                    onClick={() => handleSellerClick(seller.phone)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors duration-150 text-left group"
                  >
                    <div className="mr-3 flex-shrink-0">
                      <span className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full text-sm font-semibold group-hover:bg-green-500 group-hover:text-white transition-colors">
                        {seller.full_name.substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-700 group-hover:text-green-600">{seller.full_name}</p>
                      <p className="text-xs text-gray-500 group-hover:text-green-500">Disponível no WhatsApp</p>
                    </div>
                    <Send size={18} className="text-gray-400 group-hover:text-green-500 ml-2 flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default WhatsAppFloatingButton; 