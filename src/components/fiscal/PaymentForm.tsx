
import React, { useState } from 'react';

export interface PaymentData {
  method: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
  installments: number;
  otherDetails?: string;
}

interface PaymentFormProps {
  totalValue: number;
  onPaymentDataChange: (data: PaymentData) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ totalValue, onPaymentDataChange }) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'cash',
    installments: 1,
    otherDetails: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const updatedData = {
      ...paymentData,
      [name]: name === 'installments' ? parseInt(value, 10) : value,
    };

    setPaymentData(updatedData);
    onPaymentDataChange(updatedData);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-cascadia mb-4">Forma de Pagamento</h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="method" className="form-label">Método de Pagamento</label>
          <select
            id="method"
            name="method"
            value={paymentData.method}
            onChange={handleChange}
            className="form-input"
          >
            <option value="credit">Cartão de Crédito</option>
            <option value="debit">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
            <option value="other">Outro</option>
          </select>
        </div>

        {paymentData.method === 'credit' && (
          <div>
            <label htmlFor="installments" className="form-label">Número de Parcelas</label>
            <select
              id="installments"
              name="installments"
              value={paymentData.installments}
              onChange={handleChange}
              className="form-input"
            >
              {[...Array(12)].map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}x {index === 0 
                    ? `de R$ ${totalValue.toFixed(2)}` 
                    : `de R$ ${(totalValue / (index + 1)).toFixed(2)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {paymentData.method === 'other' && (
          <div>
            <label htmlFor="otherDetails" className="form-label">Detalhes do Pagamento</label>
            <input
              type="text"
              id="otherDetails"
              name="otherDetails"
              value={paymentData.otherDetails || ''}
              onChange={handleChange}
              className="form-input"
              placeholder="Especifique a forma de pagamento"
            />
          </div>
        )}

        <div className="bg-fiscal-gray-100 p-4 rounded-md mt-2">
          <div className="flex justify-between font-medium">
            <span>Valor Total:</span>
            <span>R$ {totalValue.toFixed(2)}</span>
          </div>

          {paymentData.method === 'credit' && paymentData.installments > 1 && (
            <div className="flex justify-between text-sm text-fiscal-gray-600 mt-2">
              <span>{paymentData.installments}x de:</span>
              <span>R$ {(totalValue / paymentData.installments).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
