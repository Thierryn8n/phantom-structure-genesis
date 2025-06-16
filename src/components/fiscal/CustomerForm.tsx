import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Edit, Check, Search, UserRound, MapPinned, Building, Hash, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { CustomersService } from '@/services/customersService';
import { Customer, CustomerAddress } from '@/types/Customer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Importações adicionais para o Dialog
import * as Dialog from '@radix-ui/react-dialog';

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
  email?: string;
  signature?: string; // Base64 string for signature
}

export interface CustomerFormProps {
  onCustomerDataChange: (data: CustomerData) => void;
  onSaveRef?: (saveMethod: () => void) => void; // Nova propriedade para expor o método de salvamento
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onCustomerDataChange, onSaveRef }) => {
  const { toast } = useToast();
  const { isMobile } = useDeviceDetect();
  const { user } = useAuth();
  
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
    email: '',
  });
  
  // Signature state (would be implemented with a library like react-signature-canvas)
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  // Estado para os clientes salvos
  const [savedCustomers, setSavedCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  
  // Estado para controlar o carregamento do CEP
  const [loadingCep, setLoadingCep] = useState(false);
  
  // Estado para controlar o filtro de pesquisa
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar clientes do Supabase
  useEffect(() => {
    loadCustomers();
  }, []);

  // Função para carregar clientes do Supabase
  const loadCustomers = async () => {
    if (!user) return;
    
    setIsLoadingCustomers(true);
    try {
      const result = await CustomersService.getCustomers({
        page: 1,
        pageSize: 100 // Carregar uma quantidade razoável para performance
      });
      
      setSavedCustomers(result.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'error',
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
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
    const updatedData = name.includes('.')
      ? {
          ...customerData,
          address: {
            ...customerData.address,
            [name.split('.')[1]]: value
          }
        }
      : {
          ...customerData,
          [name]: value
        };
    
    onCustomerDataChange({
      ...updatedData,
      signature
    });
  };

  // Buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    // Limpar formatação do CEP (remover hífen)
    const cleanCep = cep.replace(/\D/g, '');
    
    // Verificar se o CEP tem o tamanho correto
    if (cleanCep.length !== 8) {
      return;
    }
    
    setLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar o CEP');
      }
      
      const data = await response.json();
      
      // Verificar se o CEP existe
      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP informado.',
          variant: 'warning',
        });
        return;
      }
      
      // Atualizar os campos de endereço
      const updatedAddress = {
        ...customerData.address,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      };
      
      setCustomerData(prev => ({
        ...prev,
        address: updatedAddress
      }));
      
      // Atualizar o componente pai
      onCustomerDataChange({
        ...customerData,
        address: updatedAddress,
        signature
      });
      
      toast({
        title: 'Endereço encontrado',
        description: 'Os dados do endereço foram preenchidos automaticamente.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Ocorreu um erro ao buscar o endereço. Tente novamente.',
        variant: 'error',
      });
    } finally {
      setLoadingCep(false);
    }
  };
  
  // Manipulador para o evento de blur do campo CEP
  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    if (cep && cep.length >= 8) {
      fetchAddressByCep(cep);
    }
  };

  // Salvar cliente no Supabase
  const saveCustomerToSupabase = async () => {
    // Verificar se temos dados suficientes para salvar o cliente
    if (!customerData.name || !customerData.phone) {
      toast({
        title: 'Dados incompletos',
        description: 'Nome e telefone são obrigatórios para salvar o cliente.',
        variant: 'warning',
      });
      return; // Não salva se não tiver os campos obrigatórios
    }
    
    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Você precisa estar logado para salvar clientes.',
        variant: 'error',
      });
      return;
    }
    
    try {
      // Verificar se a sessão está válida antes de tentar salvar
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Tentar renovar a sessão automaticamente
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          toast({
            title: 'Sessão expirada',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
            variant: 'error',
          });
          // Redirecionar para página de login aqui, se necessário
          return;
        }
      }
    
      // Converter para o formato do Customer para salvar
      const customerToSave: Customer = {
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        signature: customerData.signature,
        ownerId: user.id
      };
      
      // Verificar se este cliente já existe (pelo ID armazenado)
      const existingCustomerId = savedCustomers.find(
      c => c.name.toLowerCase() === customerData.name.toLowerCase() && c.phone === customerData.phone
      )?.id;
    
      if (existingCustomerId) {
        customerToSave.id = existingCustomerId;
      }
      
      // Salvar no Supabase
      const savedCustomer = await CustomersService.saveCustomer(customerToSave);
      
      if (savedCustomer) {
        // Atualizar o customerData com os dados do cliente salvo, incluindo o ID
        const updatedCustomerData = {
          name: savedCustomer.name,
          address: savedCustomer.address as CustomerData['address'],
          phone: savedCustomer.phone,
          signature: savedCustomer.signature
        };
        
        // Atualizar o estado local
        setCustomerData(updatedCustomerData);
        
        // Atualizar o componente pai com os dados atualizados
        onCustomerDataChange(updatedCustomerData);
      
      toast({
        title: 'Cliente salvo',
          description: 'Os dados do cliente foram salvos com sucesso.',
          variant: 'success',
        });
        
        // Atualizar a lista de clientes
        if (!existingCustomerId) {
          setSavedCustomers([...savedCustomers, savedCustomer]);
        } else {
          setSavedCustomers(
            savedCustomers.map(c => c.id === existingCustomerId ? savedCustomer : c)
          );
    }
      }
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
  
      // Tratamento específico para erros de autenticação
      if (error.message?.includes('autenticação') || error.message?.includes('sessão expirada') || 
          error.message?.includes('não autenticado') || error.status === 401) {
        toast({
          title: 'Erro de autenticação',
          description: 'Sua sessão expirou. Por favor, recarregue a página e faça login novamente.',
          variant: 'error',
        });
        
        // Tentar renovar a sessão automaticamente
        try {
          console.log("Tentando renovar sessão após erro de autenticação...");
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            toast({
              title: 'Sessão renovada',
              description: 'Tente salvar o cliente novamente.',
              variant: 'success',
            });
          }
        } catch (refreshError) {
          console.error("Erro ao renovar sessão:", refreshError);
        }
      } else {
        toast({
          title: 'Erro ao salvar cliente',
          description: error.message || 'Ocorreu um erro ao salvar os dados do cliente.',
          variant: 'error',
        });
      }
    }
  };
  
  // Expor método de salvamento ao componente pai
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(saveCustomerToSupabase);
    }
  }, [onSaveRef, customerData, signature, user]);

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

  // Buscar clientes por termo de pesquisa no Supabase
  const handleSearchCustomers = async () => {
    if (!searchTerm.trim()) {
      await loadCustomers(); // Se a busca for vazia, carrega todos os clientes
      return;
    }
    
    try {
      const customers = await CustomersService.searchCustomers(searchTerm);
      setSavedCustomers(customers);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  // Load customer data from saved customers
  const handleSelectCustomer = (customerId: string) => {
    const selectedCustomer = savedCustomers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setCustomerData({
        name: selectedCustomer.name,
        address: selectedCustomer.address as CustomerData['address'],
        phone: selectedCustomer.phone,
        signature: selectedCustomer.signature
      });
      
      // Update parent component
      onCustomerDataChange({
        name: selectedCustomer.name,
        address: selectedCustomer.address as CustomerData['address'],
        phone: selectedCustomer.phone,
        signature: selectedCustomer.signature
      });
      
      toast({
        title: 'Cliente carregado',
        description: 'Os dados do cliente foram carregados com sucesso.',
      });
    }
  };
  
  // Handle search input change and trigger search when Enter is pressed
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    // Auto search after 500ms if not empty
    if (e.target.value.trim()) {
      const timer = setTimeout(() => {
        handleSearchCustomers();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  };
  
  // Handle key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchCustomers();
    }
  };

  return (
    <div className={`${isMobile ? '' : 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'}`}>
      {/* Header com gradiente */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                <User size={20} className="text-white" />
              </span>
              <h3 className="text-lg font-cascadia text-white">Dados do Cliente</h3>
            </div>
        
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="pl-9 pr-5 py-2.5 rounded-xl bg-white drop-shadow-md border-2 border-fiscal-green-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-fiscal-green-400 focus:ring-opacity-60 transition-all cursor-pointer hover:bg-fiscal-green-50 hover:border-fiscal-green-300 hover:shadow-md active:scale-95 flex items-center group animate-pulse hover:animate-none">
                  <div className="absolute left-2.5 w-6 h-6 flex items-center justify-center bg-fiscal-green-500 group-hover:bg-fiscal-green-600 text-white rounded-full transition-all">
                    <Search size={14} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">Selecionar cliente...</span>
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg z-50 border border-gray-200 p-0 overflow-hidden animate-in fade-in-90 zoom-in-90">
                  <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-4 flex items-center justify-between">
                    <h3 className="text-lg font-cascadia text-white flex items-center">
                      <UserRound size={18} className="mr-2" />
                      Selecionar Cliente
                    </h3>
                    <Dialog.Close asChild>
                      <button className="text-white hover:bg-white/20 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-white">
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  </div>
                  
                  <div className="p-4">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome ou telefone..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleSearchKeyPress}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors shadow-sm bg-gray-50 hover:bg-white focus:bg-white"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fiscal-green-500">
                        <Search size={16} />
                      </div>
                      {searchTerm && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            loadCustomers();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-[50vh] overflow-y-auto">
                      {isLoadingCustomers ? (
                        <div className="flex justify-center items-center py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fiscal-green-500"></div>
                          <span className="ml-2 text-gray-600">Carregando clientes...</span>
                        </div>
                      ) : savedCustomers.length > 0 ? (
                        <div className="space-y-2">
                          {savedCustomers.map(customer => (
                            <Dialog.Close asChild key={customer.id}>
                              <button
                                onClick={() => handleSelectCustomer(customer.id!)}
                                className="w-full text-left p-3 rounded-lg hover:bg-fiscal-green-50 focus:bg-fiscal-green-50 focus:outline-none transition-all border border-gray-100 hover:border-fiscal-green-200 hover:shadow-sm group"
                              >
                                <div className="flex items-center">
                                  <div className="bg-fiscal-green-100 text-fiscal-green-600 p-2 rounded-full mr-3 group-hover:bg-fiscal-green-500 group-hover:text-white transition-all">
                                    <UserRound size={18} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium group-hover:text-fiscal-green-700 transition-colors">{customer.name}</div>
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <Phone size={14} className="mr-1 opacity-70" /> {customer.phone}
                                    </div>
                                    {customer.address && customer.address.city && (
                                      <div className="text-sm text-gray-500 flex items-center mt-1">
                                        <MapPin size={14} className="mr-1 opacity-70" /> 
                                        {customer.address.city}
                                        {customer.address.state && `, ${customer.address.state}`}
                                      </div>
                                    )}
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-fiscal-green-100 text-fiscal-green-700 rounded-full p-1">
                                      <Check size={16} />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </Dialog.Close>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UserRound size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500">Nenhum cliente encontrado.</p>
                          <p className="text-gray-400 text-sm mt-1">Tente outro termo de busca ou cadastre um novo cliente.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      )}
      
      {/* Mobile header simplified */}
      {isMobile && (
        <div className="bg-fiscal-green-500 p-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center">
            <User size={20} className="text-white mr-2" />
            <h3 className="text-white font-medium">Dados do Cliente</h3>
          </div>
          
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="bg-white px-3 py-1.5 rounded-lg text-fiscal-green-700 text-sm font-medium shadow-sm">
                Selecionar
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-xl shadow-lg z-50 border-t border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-3 flex items-center justify-between">
                  <h3 className="text-base font-medium text-white flex items-center">
                    <UserRound size={16} className="mr-2" />
                    Selecionar Cliente
                  </h3>
                  <Dialog.Close asChild>
                    <button className="text-white hover:bg-white/20 rounded-full p-1">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="p-3">
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onKeyDown={handleSearchKeyPress}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fiscal-green-500">
                      <Search size={14} />
                    </div>
                    {searchTerm && (
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          loadCustomers();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {isLoadingCustomers ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-fiscal-green-500"></div>
                        <span className="ml-2 text-gray-600 text-sm">Carregando...</span>
                      </div>
                    ) : savedCustomers.length > 0 ? (
                      <div className="space-y-1.5">
                        {savedCustomers.map(customer => (
                          <Dialog.Close asChild key={customer.id}>
                            <button
                              onClick={() => handleSelectCustomer(customer.id!)}
                              className="w-full text-left p-2.5 rounded-lg bg-gray-50 hover:bg-fiscal-green-50 border border-gray-100 hover:border-fiscal-green-200 text-sm"
                            >
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <Phone size={12} className="mr-1" /> {customer.phone}
                                  </div>
                                </div>
                                <Check size={16} className="text-fiscal-green-500" />
                              </div>
                            </button>
                          </Dialog.Close>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">Nenhum cliente encontrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
      
      {/* Info box */}
      <div className="bg-amber-50 text-amber-700 text-sm p-2.5 flex items-start border-b border-amber-100">
        <Search size={16} className="mr-2 flex-shrink-0 mt-0.5" />
        <span>Dica: Use o botão "Selecionar cliente" para buscar clientes já cadastrados</span>
      </div>

      {/* Form Content */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
              <User size={14} className="mr-1.5" /> Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            placeholder="Nome completo do cliente"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            required
          />
        </div>
        
          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
              <Phone size={14} className="mr-1.5" /> Telefone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customerData.phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
              required
          />
        </div>
        
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
              <User size={14} className="mr-1.5" /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={customerData.email}
              onChange={handleChange}
              placeholder="exemplo@exemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
        
          {/* Endereço (opcional) */}
        <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <MapPinned size={14} className="mr-1.5" /> Endereço <span className="text-gray-400 text-xs ml-1">(opcional)</span>
              </label>
          </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Rua */}
              <div>
                <label htmlFor="address.street" className="block text-xs text-gray-500 mb-1">
                  Rua
                </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={customerData.address.street}
              onChange={handleChange}
                placeholder="Rua"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
              
              {/* Número */}
              <div>
                <label htmlFor="address.number" className="block text-xs text-gray-500 mb-1">
                  Número
                </label>
            <input
              type="text"
              id="address.number"
              name="address.number"
              value={customerData.address.number}
              onChange={handleChange}
                  placeholder="N°"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
          
              {/* Bairro */}
          <div>
                <label htmlFor="address.neighborhood" className="block text-xs text-gray-500 mb-1">
                  Bairro
                </label>
            <input
              type="text"
              id="address.neighborhood"
              name="address.neighborhood"
              value={customerData.address.neighborhood}
              onChange={handleChange}
              placeholder="Bairro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
          </div>
              
              {/* CEP */}
          <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="address.zipCode" className="block text-xs text-gray-500 mb-1">
                    CEP
                  </label>
                </div>
                <div className="relative">
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={customerData.address.zipCode}
              onChange={handleChange}
                  onBlur={handleCepBlur}
              placeholder="00000-000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-t-2 border-fiscal-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
                <div className="text-xs text-fiscal-green-700 mt-1">
                  Digite o CEP para preencher o endereço automaticamente
            </div>
          </div>
          
              {/* Cidade */}
          <div>
                <label htmlFor="address.city" className="block text-xs text-gray-500 mb-1">
                  Cidade
                </label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={customerData.address.city}
              onChange={handleChange}
              placeholder="Cidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
            />
              </div>
              
              {/* Estado */}
          <div>
                <label htmlFor="address.state" className="block text-xs text-gray-500 mb-1">
                  Estado
                </label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={customerData.address.state}
              onChange={handleChange}
                  placeholder="Estado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-fiscal-green-500 focus:border-fiscal-green-500"
                />
              </div>
              </div>
            </div>
        </div>
      
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveCustomerToSupabase}
            className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-4 py-2 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:ring-opacity-50 transition-colors"
          >
            <Check size={16} className="mr-1.5" />
            Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
