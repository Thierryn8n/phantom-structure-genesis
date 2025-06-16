import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Receipt, Info, Landmark, BarChart3, Clock, Smartphone, CircleDollarSign, CreditCardIcon, Check, BanknoteIcon, QrCode } from 'lucide-react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';

// Interface para as configurações de parcelas no crédito
interface InstallmentFee {
  id: string;
  installments: number;
  fee: number;
}

export interface PaymentData {
  total: number;
  method: 'credit' | 'debit' | 'pix' | 'cash' | 'other' | 'bank_transfer' | 'store_credit' | 'installment_plan' | 'mobile_payment' | 'check' | 'money_order' | 'voucher';
  installments: number;
  installmentValue?: number;
  appliedFee?: number;
  totalWithFees?: number;
  observation?: string;
  dueDate?: string;
  otherDetails?: string;
}

interface PaymentFormProps {
  totalValue: number;
  onPaymentDataChange: (data: PaymentData) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ totalValue, onPaymentDataChange }) => {
  const { isMobile } = useDeviceDetect();
  const [installmentFees, setInstallmentFees] = useState<InstallmentFee[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    total: totalValue,
    method: 'cash',
    installments: 1,
    installmentValue: totalValue,
    appliedFee: 0,
    totalWithFees: totalValue,
    observation: '',
    dueDate: '',
    otherDetails: ''
  });

  // Carregar as taxas de parcelas do localStorage
  useEffect(() => {
    const storedFees = localStorage.getItem('settings_installmentFees');
    if (storedFees) {
      try {
        const parsedFees = JSON.parse(storedFees);
        if (Array.isArray(parsedFees)) {
          setInstallmentFees(parsedFees);
        }
      } catch (e) {
        console.error('Erro ao carregar taxas de parcelas:', e);
      }
    }
  }, []);

  // Calcular valor com juros quando as parcelas ou o método de pagamento mudar
  useEffect(() => {
    if (paymentData.method === 'credit' && paymentData.installments > 1) {
      // Buscar a taxa configurada para o número de parcelas
      const feeConfig = installmentFees.find(fee => fee.installments === paymentData.installments);
      const appliedFee = feeConfig ? feeConfig.fee : 0;
      
      // Calcular o valor total com juros
      const totalWithFees = totalValue * (1 + appliedFee / 100);
      
      // Calcular o valor de cada parcela
      const installmentValue = totalWithFees / paymentData.installments;
      
      // Atualizar o estado com os novos valores calculados
      const updatedData = {
        ...paymentData,
        appliedFee,
        totalWithFees,
        installmentValue
      };
      
      setPaymentData(updatedData);
      onPaymentDataChange(updatedData);
    } else {
      // Sem juros para outros métodos ou pagamento à vista
      const updatedData = {
        ...paymentData,
        appliedFee: 0,
        totalWithFees: totalValue,
        installmentValue: paymentData.installments > 0 ? totalValue / paymentData.installments : totalValue
      };
      
      setPaymentData(updatedData);
      onPaymentDataChange(updatedData);
    }
  }, [paymentData.method, paymentData.installments, totalValue, installmentFees, onPaymentDataChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const updatedData = {
      ...paymentData,
      [name]: name === 'installments' ? parseInt(value, 10) : value,
    };

    setPaymentData(updatedData);
  };

  const getPaymentIcon = () => {
    switch (paymentData.method) {
      case 'credit':
        return <CreditCard size={isMobile ? 16 : 20} className="text-blue-600" />;
      case 'debit':
        return <CreditCardIcon size={isMobile ? 16 : 20} className="text-green-600" />;
      case 'cash':
        return <Banknote size={isMobile ? 16 : 20} className="text-green-700" />;
      case 'pix':
        return <QrCode size={isMobile ? 16 : 20} className="text-purple-600" />;
      case 'bank_transfer':
        return <Landmark size={isMobile ? 16 : 20} className="text-blue-800" />;
      case 'store_credit':
        return <BarChart3 size={isMobile ? 16 : 20} className="text-orange-600" />;
      case 'installment_plan':
        return <Clock size={isMobile ? 16 : 20} className="text-indigo-600" />;
      case 'mobile_payment':
        return <Smartphone size={isMobile ? 16 : 20} className="text-teal-600" />;
      case 'check':
        return <BanknoteIcon size={isMobile ? 16 : 20} className="text-gray-700" />;
      case 'money_order':
        return <CircleDollarSign size={isMobile ? 16 : 20} className="text-yellow-600" />;
      case 'voucher':
        return <Check size={isMobile ? 16 : 20} className="text-green-500" />;
      default:
        return <Info size={isMobile ? 16 : 20} className="text-gray-500" />;
    }
  };

  // Obter o nome legível do método de pagamento
  const getPaymentMethodName = (method: string): string => {
    const methodNames: Record<string, string> = {
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'bank_transfer': 'Transferência Bancária',
      'store_credit': 'Crédito na Loja',
      'installment_plan': 'Crediário',
      'mobile_payment': 'Pagamento por Aplicativo',
      'check': 'Cheque',
      'money_order': 'Ordem de Pagamento',
      'voucher': 'Vale/Voucher',
      'other': 'Outro'
    };
    
    return methodNames[method] || 'Desconhecido';
  };

  // Gerar opções de parcelas com valores corretos
  const generateInstallmentOptions = () => {
    return [...Array(12)].map((_, index) => {
      const installmentNumber = index + 1;
      const feeConfig = installmentFees.find(fee => fee.installments === installmentNumber);
      const appliedFee = feeConfig ? feeConfig.fee : 0;
      
      let optionText = '';
      let installmentValue = 0;
      
      if (installmentNumber === 1) {
        // Pagamento à vista
        optionText = `1x de R$ ${totalValue.toFixed(2)}`;
        installmentValue = totalValue;
      } else {
        // Pagamento parcelado
        if (appliedFee > 0) {
          // Com juros
          const totalWithFees = totalValue * (1 + appliedFee / 100);
          installmentValue = totalWithFees / installmentNumber;
          optionText = `${installmentNumber}x de R$ ${installmentValue.toFixed(2)} (${appliedFee}% juros)`;
        } else {
          // Sem juros
          installmentValue = totalValue / installmentNumber;
          optionText = `${installmentNumber}x de R$ ${installmentValue.toFixed(2)}`;
        }
      }
      
      return (
        <option key={installmentNumber} value={installmentNumber}>
          {optionText}
        </option>
      );
    });
  };

  return (
    <div className={`bg-white ${isMobile ? 'p-3' : 'p-6'} rounded-xl border border-gray-200 shadow-sm`}>
      <div className="flex items-center mb-3">
        <span className={`bg-fiscal-green-500 text-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg ${isMobile ? 'mr-2' : 'mr-3'}`}>
          {getPaymentIcon()}
        </span>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cascadia`}>Forma de Pagamento</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="method" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>Método de Pagamento</label>
          
          {/* Cartões */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Cartões</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard size={18} className="text-blue-600" /> },
                { id: 'debit', name: 'Cartão de Débito', icon: <CreditCardIcon size={18} className="text-green-600" /> }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, method: method.id as any })}
                  className={`flex items-center p-2 rounded-lg border text-sm ${
                    paymentData.method === method.id 
                      ? 'border-fiscal-green-500 bg-fiscal-green-50 text-fiscal-green-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full mr-2 ${
                    paymentData.method === method.id ? 'bg-fiscal-green-100' : 'bg-gray-100'
                  }`}>
                    {method.icon}
                  </div>
                  <span className="font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Pagamentos Eletrônicos */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Pagamentos Eletrônicos</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'pix', name: 'PIX', icon: <QrCode size={18} className="text-purple-600" /> }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, method: method.id as any })}
                  className={`flex items-center p-2 rounded-lg border text-sm ${
                    paymentData.method === method.id 
                      ? 'border-fiscal-green-500 bg-fiscal-green-50 text-fiscal-green-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full mr-2 ${
                    paymentData.method === method.id ? 'bg-fiscal-green-100' : 'bg-gray-100'
                  }`}>
                    {method.icon}
                  </div>
                  <span className="font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Dinheiro */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Dinheiro</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'cash', name: 'Dinheiro', icon: <Banknote size={18} className="text-green-700" /> }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, method: method.id as any })}
                  className={`flex items-center p-2 rounded-lg border text-sm ${
                    paymentData.method === method.id 
                      ? 'border-fiscal-green-500 bg-fiscal-green-50 text-fiscal-green-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full mr-2 ${
                    paymentData.method === method.id ? 'bg-fiscal-green-100' : 'bg-gray-100'
                  }`}>
                    {method.icon}
                  </div>
                  <span className="font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {paymentData.method === 'credit' && (
          <div>
            <label htmlFor="installments" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>Número de Parcelas</label>
            <select
              id="installments"
              name="installments"
              value={paymentData.installments}
              onChange={handleChange}
              className={`w-full ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors`}
            >
              {generateInstallmentOptions()}
            </select>
          </div>
        )}

        {paymentData.method === 'other' && (
          <div>
            <label htmlFor="otherDetails" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
              Detalhes do Pagamento
            </label>
            <input
              type="text"
              id="otherDetails"
              name="otherDetails"
              value={paymentData.otherDetails || ''}
              onChange={handleChange}
              placeholder="Especifique o método de pagamento..."
              className={`w-full ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors`}
            />
          </div>
        )}

        {(paymentData.method === 'installment_plan' || paymentData.method === 'bank_transfer' || paymentData.method === 'check') && (
          <div>
            <label htmlFor="dueDate" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
              Data de Vencimento
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={paymentData.dueDate || ''}
              onChange={handleChange}
              className={`w-full ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors`}
            />
          </div>
        )}

        <div>
          <label htmlFor="observation" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-1`}>
            Observações de Pagamento
          </label>
          <textarea
            id="observation"
            name="observation"
            value={paymentData.observation || ''}
            onChange={handleChange}
            rows={2}
            placeholder="Informações adicionais sobre o pagamento..."
            className={`w-full ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors`}
          />
        </div>
        
        {/* Dica contextual com base no método de pagamento */}
        <div className="mt-2 text-sm">
          {paymentData.method === 'pix' && (
            <div className="bg-purple-50 text-purple-700 p-2 rounded-lg border border-purple-200">
              <div className="flex items-center font-medium mb-1">
                <QrCode size={16} className="mr-1.5" /> 
                <span>Dica para PIX</span>
              </div>
              <p className="text-xs">Gere o QR code PIX e compartilhe com o cliente. O pagamento é processado instantaneamente.</p>
            </div>
          )}
          
          {paymentData.method === 'credit' && (
            <div className="bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-200">
              <div className="flex items-center font-medium mb-1">
                <CreditCard size={16} className="mr-1.5" /> 
                <span>Dica para Cartão de Crédito</span>
              </div>
              <p className="text-xs">Verifique se há taxas adicionais para parcelamentos. Os valores já incluem as taxas configuradas no sistema.</p>
            </div>
          )}
          
          {paymentData.method === 'check' && (
            <div className="bg-gray-50 text-gray-700 p-2 rounded-lg border border-gray-200">
              <div className="flex items-center font-medium mb-1">
                <BanknoteIcon size={16} className="mr-1.5" /> 
                <span>Dica para Cheque</span>
              </div>
              <p className="text-xs">Certifique-se de registrar a data de compensação do cheque e verificar a assinatura.</p>
            </div>
          )}
          
          {paymentData.method === 'installment_plan' && (
            <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg border border-indigo-200">
              <div className="flex items-center font-medium mb-1">
                <Clock size={16} className="mr-1.5" /> 
                <span>Dica para Crediário</span>
              </div>
              <p className="text-xs">Defina as datas de vencimento de cada parcela. Você pode gerar carnês de pagamento no menu Financeiro.</p>
            </div>
          )}
        </div>

        <div className={`mt-2 bg-fiscal-green-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg border border-fiscal-green-100`}>
          <div className="flex justify-between font-medium text-fiscal-green-900">
            <span className={isMobile ? 'text-sm' : ''}>Valor Total:</span>
            <span className={isMobile ? 'text-base' : 'text-lg'}>
              R$ {paymentData.method === 'credit' && paymentData.installments > 1 && paymentData.appliedFee > 0 
                ? paymentData.totalWithFees?.toFixed(2) 
                : totalValue.toFixed(2)}
            </span>
          </div>

          {paymentData.method === 'credit' && paymentData.installments > 1 && (
            <>
              {paymentData.appliedFee > 0 && (
                <div className="flex justify-between text-xs text-fiscal-green-700 mt-1.5">
                  <span>Taxa aplicada:</span>
                  <span>{paymentData.appliedFee}%</span>
                </div>
              )}
            <div className="flex justify-between text-sm text-fiscal-green-700 mt-2 border-t border-fiscal-green-200 pt-2">
              <span>{paymentData.installments}x de:</span>
                <span className="font-medium">R$ {paymentData.installmentValue?.toFixed(2)}</span>
            </div>
            </>
          )}
          
          <div className={`flex items-center mt-2 bg-white ${isMobile ? 'p-1.5' : 'p-2'} rounded-md border border-fiscal-green-200`}>
            <div className={`${isMobile ? 'p-1' : 'p-1.5'} rounded-full bg-fiscal-green-100 mr-2`}>
              {getPaymentIcon()}
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-fiscal-green-800`}>
              <span className="font-medium">Método selecionado:</span>{' '}
              {getPaymentMethodName(paymentData.method)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
