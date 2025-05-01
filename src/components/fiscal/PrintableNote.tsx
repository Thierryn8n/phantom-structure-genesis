
import React, { forwardRef } from 'react';
import { SelectedProduct } from './ProductSelector';
import { CustomerData } from './CustomerForm';
import { PaymentData } from './PaymentForm';

interface CompanyData {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
}

interface PrintableNoteProps {
  noteNumber: string;
  date: string;
  products: SelectedProduct[];
  customerData: CustomerData;
  paymentData: PaymentData;
  totalValue: number;
}

// Mock company data - in a real scenario, this would come from configuration
const COMPANY_DATA: CompanyData = {
  name: 'Empresa Demonstração LTDA',
  cnpj: '12.345.678/0001-90',
  address: 'Rua Exemplo, 123 - Centro - Cidade - UF',
  phone: '(11) 1234-5678',
};

const PrintableNote = forwardRef<HTMLDivElement, PrintableNoteProps>(
  ({ noteNumber, date, products, customerData, paymentData, totalValue }, ref) => {
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

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto font-inter text-black">
        {/* Company Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-fiscal-green-500 flex items-center justify-center rounded-full">
                <span className="text-xl font-cascadia text-white">FF</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-cascadia">{COMPANY_DATA.name}</h1>
                <p className="text-sm">CNPJ: {COMPANY_DATA.cnpj}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="font-cascadia text-xl">ORÇAMENTO</h2>
              <p className="text-sm">Nº {noteNumber}</p>
              <p className="text-sm">Data: {date}</p>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <p>{COMPANY_DATA.address}</p>
            <p>Tel: {COMPANY_DATA.phone}</p>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6">
          <h3 className="font-cascadia text-lg border-b border-fiscal-gray-300 pb-1 mb-2">
            Dados do Cliente
          </h3>
          <p><strong>Nome:</strong> {customerData.name}</p>
          <p>
            <strong>Endereço:</strong> {customerData.address.street}, {customerData.address.number} - {customerData.address.neighborhood}, {customerData.address.city} - {customerData.address.state}, {customerData.address.zipCode}
          </p>
          <p><strong>Telefone:</strong> {customerData.phone}</p>
        </div>

        {/* Products */}
        <div className="mb-6">
          <h3 className="font-cascadia text-lg border-b border-fiscal-gray-300 pb-1 mb-2">
            Produtos
          </h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-fiscal-gray-100">
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Produto</th>
                <th className="px-2 py-2 text-right">Preço Unit.</th>
                <th className="px-2 py-2 text-center">Qtd</th>
                <th className="px-2 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-fiscal-gray-200">
                  <td className="px-2 py-2">{product.code}</td>
                  <td className="px-2 py-2">{product.name}</td>
                  <td className="px-2 py-2 text-right">R$ {product.price.toFixed(2)}</td>
                  <td className="px-2 py-2 text-center">{product.quantity}</td>
                  <td className="px-2 py-2 text-right">R$ {product.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td colSpan={4} className="px-2 py-2 text-right">Total:</td>
                <td className="px-2 py-2 text-right">R$ {totalValue.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Information */}
        <div className="mb-6">
          <h3 className="font-cascadia text-lg border-b border-fiscal-gray-300 pb-1 mb-2">
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
        <div className="mt-12 flex flex-col items-center">
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
        <div className="mt-12 text-center text-sm text-fiscal-gray-500">
          <p>Este documento não possui valor fiscal.</p>
          <p>Orçamento válido por 7 dias.</p>
        </div>
      </div>
    );
  }
);

PrintableNote.displayName = 'PrintableNote';

export default PrintableNote;
