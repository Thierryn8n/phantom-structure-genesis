import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const AddPrinterForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    brand: '',
    type: 'thermal',
    interfaces: [],
    paperWidth: 80,
    dpi: 203,
    speed: 150,
    description: '',
    isDefault: false
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'interfaces') {
      // Tratamento especial para o campo 'interfaces' que é um array
      const interfaceValue = value;
      const newInterfaces = [...formData.interfaces];
      
      if (checked) {
        // Adicionar à lista se foi marcado
        if (!newInterfaces.includes(interfaceValue)) {
          newInterfaces.push(interfaceValue);
        }
      } else {
        // Remover da lista se foi desmarcado
        const index = newInterfaces.indexOf(interfaceValue);
        if (index !== -1) {
          newInterfaces.splice(index, 1);
        }
      }
      
      setFormData({
        ...formData,
        interfaces: newInterfaces
      });
    } else {
      // Para outros campos
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validar os dados do formulário
      if (!formData.name || !formData.model || !formData.brand) {
        throw new Error('Preencha os campos obrigatórios: Nome, Modelo e Fabricante');
      }
      
      if (formData.interfaces.length === 0) {
        throw new Error('Selecione pelo menos uma interface de conexão');
      }
      
      // Gerar um ID único para a nova impressora
      const newPrinter = {
        ...formData,
        id: `${formData.brand.toLowerCase()}-${formData.model.toLowerCase()}`.replace(/\s/g, '-'),
      };
      
      // Em um cenário real, enviaríamos os dados para uma API
      console.log('Nova impressora:', newPrinter);
      
      // Simulação de sucesso após 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Notificar sucesso
      toast({
        title: 'Impressora adicionada',
        description: `${formData.name} foi adicionada com sucesso`,
      });
      
      // Limpar formulário
      setFormData({
        name: '',
        model: '',
        brand: '',
        type: 'thermal',
        interfaces: [],
        paperWidth: 80,
        dpi: 203,
        speed: 150,
        description: '',
        isDefault: false
      });
      
    } catch (error) {
      console.error('Erro ao adicionar impressora:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a impressora',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-cascadia mb-6 flex items-center">
        <span className="bg-fiscal-green-500 text-white p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </span>
        Adicionar Nova Impressora
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Impressora *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Impressora da Recepção"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              Fabricante *
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Ex: Tanca, Epson, HP"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <input
              id="model"
              name="model"
              type="text"
              value={formData.model}
              onChange={handleChange}
              placeholder="Ex: TP-650, TM-T20X"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Impressora
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            >
              <option value="thermal">Térmica</option>
              <option value="inkjet">Jato de Tinta</option>
              <option value="laser">Laser</option>
              <option value="dotmatrix">Matricial</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="paperWidth" className="block text-sm font-medium text-gray-700 mb-1">
              Largura do Papel (mm)
            </label>
            <input
              id="paperWidth"
              name="paperWidth"
              type="number"
              value={formData.paperWidth}
              onChange={handleChange}
              placeholder="80"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="dpi" className="block text-sm font-medium text-gray-700 mb-1">
              Resolução (DPI)
            </label>
            <input
              id="dpi"
              name="dpi"
              type="number"
              value={formData.dpi}
              onChange={handleChange}
              placeholder="203"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">
              Velocidade (mm/s)
            </label>
            <input
              id="speed"
              name="speed"
              type="number"
              value={formData.speed}
              onChange={handleChange}
              placeholder="150"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interfaces de Conexão *
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="interfaces"
                value="USB"
                checked={formData.interfaces.includes('USB')}
                onChange={handleChange}
                className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">USB</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="interfaces"
                value="Serial"
                checked={formData.interfaces.includes('Serial')}
                onChange={handleChange}
                className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Serial</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="interfaces"
                value="Ethernet"
                checked={formData.interfaces.includes('Ethernet')}
                onChange={handleChange}
                className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Ethernet</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="interfaces"
                value="WiFi"
                checked={formData.interfaces.includes('WiFi')}
                onChange={handleChange}
                className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">WiFi</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="interfaces"
                value="Bluetooth"
                checked={formData.interfaces.includes('Bluetooth')}
                onChange={handleChange}
                className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Bluetooth</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descreva as características da impressora..."
            rows="3"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 text-fiscal-green-600 focus:ring-fiscal-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Definir como impressora padrão</span>
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-2 bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white rounded-lg flex items-center
              ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Adicionar Impressora
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPrinterForm; 