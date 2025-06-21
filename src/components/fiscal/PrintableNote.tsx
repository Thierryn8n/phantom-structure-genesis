
import React, { forwardRef, useEffect, useState } from 'react';
import { SelectedProduct } from './ProductSelector';
import { CustomerData } from './CustomerForm';
import { PaymentData } from './PaymentForm';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { SettingsService } from '@/services/settings.service';
import { CompanyData } from '@/types/settings';

interface PrintableNoteProps {
  noteNumber: string;
  date: string;
  products: SelectedProduct[];
  customerData: CustomerData;
  paymentData: PaymentData;
  totalValue: number;
}

const PrintableNote = forwardRef<HTMLDivElement, PrintableNoteProps>(
  ({ noteNumber, date, products, customerData, paymentData, totalValue }, ref) => {
    const { isMobile } = useDeviceDetect();
    const [companyData, setCompanyData] = useState<CompanyData>({
      name: 'Empresa Demonstração LTDA',
      cnpj: '12.345.678/0001-90',
      address: 'Rua Exemplo, 123, Centro',
      phone: '(11) 1234-5678',
      email: 'contato@empresa.com.br'
    });

    useEffect(() => {
      // Carregar dados da empresa do serviço de configurações
      const loadCompanyData = async () => {
        try {
          const settings = await SettingsService.getUserSettings();
          if (settings?.company_data) {
            setCompanyData(settings.company_data);
          } else {
            // Fallback para localStorage se não houver dados no serviço
            const storedCompanyData = localStorage.getItem('settings_companyData');
            if (storedCompanyData) {
              const parsedData = JSON.parse(storedCompanyData);
              setCompanyData(parsedData);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados da empresa:', error);
          // Tentar carregar do localStorage como fallback
          const storedCompanyData = localStorage.getItem('settings_companyData');
          if (storedCompanyData) {
            try {
              const parsedData = JSON.parse(storedCompanyData);
              setCompanyData(parsedData);
            } catch (e) {
              console.error('Erro ao parsear dados do localStorage:', e);
            }
          }
        }
      };

      loadCompanyData();
    }, []);

    const formatPaymentMethod = (method: string) => {
      const methods = {
        credit: 'Cartão de Crédito',
        debit: 'Cartão de Débito',
        pix: 'PIX',
        cash: 'Dinheiro',
        other: 'Outro',
      };
      return methods[method as keyof typeof methods] || method;
    };

    // Formatar endereço completo da empresa
    const formatCompanyAddress = () => {
      return companyData.address || 'Endereço não informado';
    };

    return (
      <div 
        ref={ref} 
        className={`bg-white ${isMobile ? 'p-4' : 'p-8'} max-w-4xl mx-auto font-inter text-black`}
        style={{ 
          maxWidth: isMobile ? '100%' : '4xl',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}
      >
        {/* Company Header */}
        <div className="border-b-2 border-black pb-4 mb-4">
          <div className={`${isMobile ? 'flex flex-col' : 'flex justify-between items-start'}`}>
            <div className="flex items-start">
              {companyData.logo ? (
                <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} flex items-center justify-center overflow-hidden mr-4`}>
                  <img 
                    src={companyData.logo} 
                    alt="Logo da empresa" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-fiscal-green-500 flex items-center justify-center rounded-full mr-4`}>
                  <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-cascadia text-white`}>
                    {companyData.name ? companyData.name.charAt(0).toUpperCase() : 'E'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-cascadia font-bold`}>
                  {companyData.name || 'Nome da Empresa'}
                </h1>
                {companyData.cnpj && (
                  <p className="text-sm font-medium">CNPJ: {companyData.cnpj}</p>
                )}
              </div>
            </div>
            <div className={`${isMobile ? 'mt-3 ml-3' : 'text-right ml-4'}`}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-cascadia font-bold`}>ORÇAMENTO</h2>
              <p className="text-sm font-medium">Nº {noteNumber}</p>
              <p className="text-sm">Data: {date}</p>
            </div>
          </div>
          
          {/* Informações completas da empresa */}
          <div className="mt-4 text-sm space-y-1">
            <p><strong>Endereço:</strong> {formatCompanyAddress()}</p>
            {companyData.phone && (
              <p><strong>Telefone:</strong> {companyData.phone}</p>
            )}
            {companyData.email && (
              <p><strong>Email:</strong> {companyData.email}</p>
            )}
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-4">
          <h3 className={`font-cascadia ${isMobile ? 'text-base' : 'text-lg'} border-b border-fiscal-gray-300 pb-1 mb-2`}>
            Dados do Cliente
          </h3>
          <p><strong>Nome:</strong> {customerData.name}</p>
          <p className={`${isMobile ? 'text-sm' : ''}`}>
            <strong>Endereço:</strong> {customerData.address.street}, {customerData.address.number} - {customerData.address.neighborhood}, {customerData.address.city} - {customerData.address.state}, {customerData.address.zipCode}
          </p>
          <p><strong>Telefone:</strong> {customerData.phone}</p>
        </div>

        {/* Products */}
        <div className="mb-4">
          <h3 className={`font-cascadia ${isMobile ? 'text-base' : 'text-lg'} border-b border-fiscal-gray-300 pb-1 mb-2`}>
            Produtos
          </h3>
          <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
            <table className={`w-full text-left ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <thead>
                <tr className="bg-fiscal-gray-100">
                  <th className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'}`}>Código</th>
                  <th className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'}`}>Produto</th>
                  <th className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>Preço</th>
                  <th className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-center`}>Qtd</th>
                  <th className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-fiscal-gray-200">
                    <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'}`}>{product.code}</td>
                    <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'}`}>{product.name}</td>
                    <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>R$ {product.price.toFixed(2)}</td>
                    <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-center`}>{product.quantity}</td>
                    <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>R$ {product.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td colSpan={4} className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>Total:</td>
                  <td className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2'} text-right`}>R$ {totalValue.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-4">
          <h3 className={`font-cascadia ${isMobile ? 'text-base' : 'text-lg'} border-b border-fiscal-gray-300 pb-1 mb-2`}>
            Forma de Pagamento
          </h3>
          <p><strong>Método:</strong> {formatPaymentMethod(paymentData.method)}</p>
          {paymentData.method === 'credit' && (
            <p><strong>Parcelas:</strong> {paymentData.installments}x de R$ {(totalValue / paymentData.installments).toFixed(2)}</p>
          )}
          {paymentData.otherDetails && (
            <p><strong>Detalhes:</strong> {paymentData.otherDetails}</p>
          )}
        </div>

        {/* Signature */}
        <div className={`${isMobile ? 'mt-8' : 'mt-12'} flex flex-col items-center`}>
          {customerData.signature ? (
            <div className="mb-2">
              <img src={customerData.signature} alt="Assinatura do Cliente" className="max-h-20" />
            </div>
          ) : (
            <div className="mb-2 border-b border-black w-64"></div>
          )}
          <p className="text-sm">Assinatura do Cliente</p>
        </div>

        {/* Footer */}
        <div className={`${isMobile ? 'mt-8' : 'mt-12'} text-center text-sm text-fiscal-gray-500`}>
          <p>Este documento não possui valor fiscal.</p>
          <p>Orçamento válido por 7 dias.</p>
        </div>
      </div>
    );
  }
);

PrintableNote.displayName = 'PrintableNote';

export default PrintableNote;
