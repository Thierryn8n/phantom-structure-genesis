
import React, { useState } from 'react';

export interface CustomerData {
  name: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  signature?: string; // Base64 string for signature
}

interface CustomerFormProps {
  onCustomerDataChange: (data: CustomerData) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onCustomerDataChange }) => {
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
  
  // Signature state (would be implemented with a library like react-signature-canvas)
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setCustomerData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Update parent component with new data
    onCustomerDataChange({
      ...customerData,
      [name]: value,
      signature
    });
  };

  // Mock signature capture
  const captureSignature = () => {
    setShowSignaturePad(true);
    // In a real implementation, we would render a canvas for signature
  };

  // Mock clear signature
  const clearSignature = () => {
    setSignature(undefined);
    setShowSignaturePad(false);
    
    // Update parent component
    onCustomerDataChange({
      ...customerData,
      signature: undefined
    });
  };
  
  // Mock save signature
  const saveSignature = () => {
    // In a real implementation, this would get the signature data from the canvas
    const mockSignatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
    setSignature(mockSignatureData);
    setShowSignaturePad(false);
    
    // Update parent component
    onCustomerDataChange({
      ...customerData,
      signature: mockSignatureData
    });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-cascadia mb-4">Dados do Cliente</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="name" className="form-label">Nome Completo</label>
          <input
            type="text"
            id="name"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="Nome completo do cliente"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.street" className="form-label">Rua</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={customerData.address.street}
              onChange={handleChange}
              className="form-input"
              placeholder="Rua/Avenida"
              required
            />
          </div>
          
          <div>
            <label htmlFor="address.number" className="form-label">Número</label>
            <input
              type="text"
              id="address.number"
              name="address.number"
              value={customerData.address.number}
              onChange={handleChange}
              className="form-input"
              placeholder="Número"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.neighborhood" className="form-label">Bairro</label>
            <input
              type="text"
              id="address.neighborhood"
              name="address.neighborhood"
              value={customerData.address.neighborhood}
              onChange={handleChange}
              className="form-input"
              placeholder="Bairro"
              required
            />
          </div>
          
          <div>
            <label htmlFor="address.zipCode" className="form-label">CEP</label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={customerData.address.zipCode}
              onChange={handleChange}
              className="form-input"
              placeholder="00000-000"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.city" className="form-label">Cidade</label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={customerData.address.city}
              onChange={handleChange}
              className="form-input"
              placeholder="Cidade"
              required
            />
          </div>
          
          <div>
            <label htmlFor="address.state" className="form-label">Estado</label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={customerData.address.state}
              onChange={handleChange}
              className="form-input"
              placeholder="UF"
              maxLength={2}
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="phone" className="form-label">Telefone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customerData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder="(00) 00000-0000"
            required
          />
        </div>
        
        <div className="mt-4">
          <label className="form-label">Assinatura do Cliente (opcional)</label>
          
          {signature ? (
            <div className="border border-fiscal-gray-200 rounded-md p-4">
              <p className="text-fiscal-gray-600 mb-2">Assinatura capturada</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Limpar assinatura
                </button>
              </div>
            </div>
          ) : showSignaturePad ? (
            <div className="border border-fiscal-gray-200 rounded-md p-4">
              <div className="bg-fiscal-gray-100 h-40 flex items-center justify-center border border-dashed border-fiscal-gray-400 mb-2">
                <p className="text-fiscal-gray-500">
                  [Área para assinatura do cliente]
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  className="text-sm text-fiscal-green-600 hover:text-fiscal-green-800"
                >
                  Salvar assinatura
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={captureSignature}
              className="btn-secondary"
            >
              Capturar Assinatura
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
