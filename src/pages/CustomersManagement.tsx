import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CustomersService } from '@/services/customersService';
import { Customer, CustomerFilters, PaginatedResponse } from '@/types/Customer';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserRound, Phone, MapPin, Search, 
  Trash2, PencilLine, ChevronLeft, ChevronRight, 
  Filter, X, Info, AlertCircle, Plus, UserPlus, Check
} from 'lucide-react';
import CustomerForm, { CustomerData } from '@/components/fiscal/CustomerForm';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import Layout from '@/components/Layout';

const ITEMS_PER_PAGE = 10;

const CustomersManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    totalPages: 1,
    totalCount: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  // Carregar clientes quando a página for carregada ou mudar a paginação
  useEffect(() => {
    loadCustomers();
  }, [pagination.page]);
  
  // Função para carregar os clientes
  const loadCustomers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const filters: CustomerFilters = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm
      };
      
      const result: PaginatedResponse<Customer> = await CustomersService.getCustomers(filters);
      
      setCustomers(result.data);
      setPagination({
        ...pagination,
        totalPages: result.totalPages,
        totalCount: result.count
      });
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para buscar clientes
  const handleSearch = async () => {
    setIsSearching(true);
    setPagination({ ...pagination, page: 1 }); // Voltar para a primeira página ao buscar
    
    try {
      // Se o termo de busca estiver vazio, carrega todos os clientes
      if (!searchTerm.trim()) {
        await loadCustomers();
        return;
      }
      
      const result = await CustomersService.searchCustomers(searchTerm);
      setCustomers(result);
      setPagination({
        ...pagination,
        totalCount: result.length,
        totalPages: Math.ceil(result.length / pagination.pageSize),
      });
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao buscar os clientes.',
        variant: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Função para excluir um cliente
  const deleteCustomer = async (id: string) => {
    try {
      setDeletingCustomerId(id);
      await CustomersService.deleteCustomer(id);
      
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi excluído com sucesso.',
        variant: 'success',
      });
      
      // Atualizar a lista de clientes
      setCustomers(customers.filter(c => c.id !== id));
      
      // Se excluiu o último item da página, voltar para a página anterior
      if (customers.length === 1 && pagination.page > 1) {
        setPagination({ ...pagination, page: pagination.page - 1 });
      } else {
        loadCustomers();
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cliente.',
        variant: 'error',
      });
    } finally {
      setDeletingCustomerId(null);
    }
  };
  
  // Função para confirmar a exclusão de um cliente
  const confirmDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) {
      deleteCustomer(id);
    }
  };
  
  // Função para editar um cliente
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };
  
  // Função para visualizar um cliente
  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
  };
  
  // Função para lidar com a mudança nos dados do cliente no formulário
  const handleCustomerDataChange = (data: CustomerData) => {
    if (editingCustomer && editingCustomer.id) {
      setEditingCustomer({
        ...editingCustomer,
        name: data.name,
        phone: data.phone,
        address: data.address,
        signature: data.signature
      });
    }
  };
  
  // Função para salvar as alterações em um cliente
  const handleSaveCustomerChanges = async () => {
    if (!editingCustomer) return;
    
    try {
      const updatedCustomer = await CustomersService.saveCustomer(editingCustomer);
      
      toast({
        title: 'Cliente atualizado',
        description: 'As alterações foram salvas com sucesso.',
        variant: 'success',
      });
      
      // Atualizar a lista de clientes
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      setEditingCustomer(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações do cliente.',
        variant: 'error',
      });
    }
  };
  
  // Função para mudar para a próxima página
  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };
  
  // Função para voltar para a página anterior
  const previousPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };
  
  // Limpar a busca e mostrar todos os clientes
  const clearSearch = () => {
    setSearchTerm('');
    // Após limpar, carrega todos os clientes
    setPagination({ ...pagination, page: 1 });
    
    // Utilizar setTimeout para garantir que o estado de searchTerm foi atualizado
    setTimeout(() => {
      loadCustomers();
    }, 0);
  };
  
  // Componente para renderizar os detalhes do cliente
  const CustomerDetails = ({ customer }: { customer: Customer }) => {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h3 className="text-2xl font-medium text-gray-800">{customer.name}</h3>
          <div className="flex items-center mt-2 text-gray-600">
            <Phone size={16} className="mr-2" />
            <span>{customer.phone}</span>
          </div>
        </div>
        
        {customer.address && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <MapPin size={16} className="mr-2" />
              Endereço
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              {customer.address.street && customer.address.number && (
                <p>{customer.address.street}, {customer.address.number}</p>
              )}
              {customer.address.neighborhood && <p>{customer.address.neighborhood}</p>}
              {customer.address.city && customer.address.state && (
                <p>{customer.address.city} - {customer.address.state}</p>
              )}
              {customer.address.zipCode && <p>CEP: {customer.address.zipCode}</p>}
            </div>
          </div>
        )}
        
        {customer.signature && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Assinatura</h4>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <img src={customer.signature} alt="Assinatura do cliente" className="max-w-full h-auto" />
            </div>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Cliente desde: {new Date(customer.createdAt || Date.now()).toLocaleDateString()}</p>
          {customer.updatedAt && (
            <p>Última atualização: {new Date(customer.updatedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  };
  
  const content = (
    <div className="container mx-auto px-4 py-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
      {/* Cabeçalho */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-cascadia flex items-center">
            <span className="bg-fiscal-green-500 text-white p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
              <UserRound size={18} className="sm:h-5 sm:w-5" />
            </span>
            Gerenciamento de Clientes
          </h2>
        
        <Dialog.Root>
          <Dialog.Trigger asChild>
              <button className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors text-sm sm:text-base w-full sm:w-auto">
                <Plus size={16} className="mr-1.5 sm:mr-2" />
                Adicionar Cliente
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[90vh] w-[95vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg z-50 overflow-auto">
              <div className="sticky top-0 bg-white z-10">
                <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-4 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <UserPlus size={18} className="mr-2" />
                    Novo Cliente
                  </h3>
                  <Dialog.Close asChild>
                      <button className="text-white hover:bg-white/20 rounded-full p-1.5 focus:outline-none">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
                <div className="p-4 sm:p-6">
                <CustomerForm 
                  onCustomerDataChange={() => {}}
                  onSaveRef={(saveMethod) => {
                    // Ao salvar, atualiza a lista e fecha o modal
                    const originalSave = saveMethod;
                    return async () => {
                      await originalSave();
                      loadCustomers();
                      document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      );
                    };
                  }}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        </div>
      </div>
      
      {/* Barra de Busca */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar clientes por nome, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-fiscal-green-500 focus:border-fiscal-green-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-2 sm:flex-shrink-0">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors disabled:opacity-70 text-sm flex-1 sm:flex-initial"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1.5 sm:mr-2"></div>
                  <span className="sm:inline hidden">Buscando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Search size={16} className="mr-1.5 sm:mr-2" />
                  <span className="sm:inline hidden">Buscar</span>
                </>
              )}
            </button>
            
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors text-sm flex-1 sm:flex-initial"
              >
                <X size={16} className="mr-1.5 sm:mr-2" />
                <span className="sm:inline hidden">Limpar</span>
              </button>
            )}
          </div>
        </div>
        
        {searchTerm && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-gray-500">
            <Filter size={14} className="mr-2" />
            <span className="text-sm">
              {pagination.totalCount === 0 
                ? 'Nenhum cliente encontrado' 
                : `${pagination.totalCount} cliente${pagination.totalCount !== 1 ? 's' : ''} encontrado${pagination.totalCount !== 1 ? 's' : ''}`}
              {pagination.totalCount > 0 && searchTerm && (
                <span className="ml-1">
                  para "<span className="font-medium text-fiscal-green-700">{searchTerm}</span>"
                </span>
              )}
            </span>
          </div>
        )}
      </div>
      
      {/* Lista de clientes */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiscal-green-500 mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      ) : customers.length > 0 ? (
        <>
          {/* Visão para Mobile (Cards) - visível apenas em telas pequenas */}
          <div className="sm:hidden space-y-3">
            {customers.map((customer, index) => (
              <div 
                key={customer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-fiscal-green-300 transition-colors"
                onClick={() => handleViewCustomer(customer)}
              >
                <div className="p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-fiscal-green-100 text-fiscal-green-600 rounded-full flex items-center justify-center">
                        <UserRound size={18} />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-semibold text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600 flex items-center mt-0.5">
                          <Phone size={14} className="mr-1" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="flex items-center space-x-1"
                      onClick={(e) => e.stopPropagation()} // Impedir que o clique nas ações abra os detalhes
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                        className="text-fiscal-green-600 hover:text-fiscal-green-800 p-1.5 hover:bg-fiscal-green-50 rounded-full transition-colors"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteCustomer(customer.id!, customer.name);
                        }}
                        disabled={deletingCustomerId === customer.id}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                      >
                        {deletingCustomerId === customer.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {customer.address?.city && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <MapPin size={14} className="mr-1 text-gray-400" />
                      {customer.address.city}
                      {customer.address.state && `, ${customer.address.state}`}
                    </div>
                  )}
                  
                  {customer.createdAt && (
                    <div className="mt-1 text-xs text-gray-400">
                      Cadastrado em: {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Visão para Desktop (Tabela) - visível apenas em telas médias e grandes */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Cadastro
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer, index) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((pagination.page - 1) * pagination.pageSize) + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-fiscal-green-100 text-fiscal-green-600 rounded-full flex items-center justify-center">
                            <UserRound size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.address?.city ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin size={14} className="mr-1 text-gray-400" />
                            {customer.address.city}
                            {customer.address.state && `, ${customer.address.state}`}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não informado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div 
                          className="flex justify-end items-center space-x-2"
                          onClick={(e) => e.stopPropagation()} // Impedir que o clique nas ações abra os detalhes
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer);
                            }}
                            className="text-fiscal-green-600 hover:text-fiscal-green-800 p-1.5 hover:bg-fiscal-green-50 rounded-full transition-colors"
                          >
                            <PencilLine size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteCustomer(customer.id!, customer.name);
                            }}
                            disabled={deletingCustomerId === customer.id}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          >
                            {deletingCustomerId === customer.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Paginação */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 sm:mt-6">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              Mostrando <span className="font-medium">{customers.length}</span> de{' '}
              <span className="font-medium">{pagination.totalCount}</span> resultados
            </div>
            
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <button
                onClick={previousPage}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm">
                {pagination.page} de {pagination.totalPages}
              </span>
              
              <button
                onClick={nextPage}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <UserRound size={30} />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? `Não encontramos nenhum cliente correspondente a "${searchTerm}". Tente outros termos de busca ou adicione um novo cliente.` 
              : 'Você ainda não tem clientes cadastrados. Clique no botão abaixo para adicionar seu primeiro cliente.'}
          </p>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-5 py-2.5 rounded-lg font-medium inline-flex items-center shadow-sm transition-colors">
                <Plus size={18} className="mr-2" />
                {searchTerm ? 'Adicionar novo cliente' : 'Cadastrar seu primeiro cliente'}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg z-50 overflow-auto">
                <div className="sticky top-0 bg-white z-10">
                  <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-4 flex items-center justify-between rounded-t-xl">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <UserPlus size={18} className="mr-2" />
                      Novo Cliente
                    </h3>
                    <Dialog.Close asChild>
                      <button className="text-white hover:bg-white/20 rounded-full p-1 focus:outline-none">
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
                
                <div className="p-6">
                  <CustomerForm 
                    onCustomerDataChange={() => {}}
                    onSaveRef={(saveMethod) => {
                      // Ao salvar, atualiza a lista e fecha o modal
                      const originalSave = saveMethod;
                      return async () => {
                        await originalSave();
                        loadCustomers();
                        document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                          new MouseEvent('click', { bubbles: true })
                        );
                      };
                    }}
                  />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
      
      {/* Modal de visualização do cliente */}
      {viewingCustomer && (
        <Dialog.Root open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg z-50 overflow-auto">
              <div className="sticky top-0 bg-white z-10">
                <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-4 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <UserRound size={18} className="mr-2" />
                    Detalhes do Cliente
                  </h3>
                  <Dialog.Close asChild>
                    <button className="text-white hover:bg-white/20 rounded-full p-1 focus:outline-none">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
              <div className="p-6">
                <Tabs.Root defaultValue="details">
                  <Tabs.List className="flex border-b border-gray-200 mb-6">
                    <Tabs.Trigger
                      value="details"
                      className="px-4 py-2 text-gray-600 hover:text-fiscal-green-600 border-b-2 border-transparent data-[state=active]:border-fiscal-green-500 data-[state=active]:text-fiscal-green-600 transition-colors"
                    >
                      Detalhes
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="edit"
                      className="px-4 py-2 text-gray-600 hover:text-fiscal-green-600 border-b-2 border-transparent data-[state=active]:border-fiscal-green-500 data-[state=active]:text-fiscal-green-600 transition-colors"
                    >
                      Editar
                    </Tabs.Trigger>
                  </Tabs.List>
                  
                  <Tabs.Content value="details">
                    <CustomerDetails customer={viewingCustomer} />
                    
                    <div className="mt-6 flex justify-between">
                      <Dialog.Close asChild>
                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors">
                          Fechar
                        </button>
                      </Dialog.Close>
                      
                      <button
                        onClick={() => {
                          confirmDeleteCustomer(viewingCustomer.id!, viewingCustomer.name);
                          setViewingCustomer(null);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors"
                      >
                        <Trash2 size={18} className="mr-2" />
                        Excluir Cliente
                      </button>
                    </div>
                  </Tabs.Content>
                  
                  <Tabs.Content value="edit">
                    <CustomerForm 
                      onCustomerDataChange={handleCustomerDataChange}
                      onSaveRef={(saveMethod) => {
                        // Substitui o método de salvar para atualizar o cliente existente
                        return async () => {
                          if (viewingCustomer && viewingCustomer.id) {
                            try {
                              // Salva as alterações no cliente
                              const customerToUpdate: Customer = {
                                ...viewingCustomer,
                                id: viewingCustomer.id,
                              };
                              
                              const updatedCustomer = await CustomersService.saveCustomer(customerToUpdate);
                              
                              toast({
                                title: 'Cliente atualizado',
                                description: 'As alterações foram salvas com sucesso.',
                                variant: 'success',
                              });
                              
                              // Atualiza a lista de clientes
                              setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
                              setViewingCustomer(null);
                              
                              // Fecha o modal
                              document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                                new MouseEvent('click', { bubbles: true })
                              );
                              
                              // Recarrega a lista
                              loadCustomers();
                            } catch (error) {
                              console.error('Erro ao atualizar cliente:', error);
                              toast({
                                title: 'Erro',
                                description: 'Não foi possível salvar as alterações do cliente.',
                                variant: 'error',
                              });
                            }
                          }
                        };
                      }}
                    />
                  </Tabs.Content>
                </Tabs.Root>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      
      {/* Modal de edição de cliente */}
      {editingCustomer && (
        <Dialog.Root open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-lg z-50 overflow-auto">
              <div className="sticky top-0 bg-white z-10">
                <div className="bg-gradient-to-r from-fiscal-green-500 to-fiscal-green-600 p-4 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <PencilLine size={18} className="mr-2" />
                    Editar Cliente
                  </h3>
                  <Dialog.Close asChild>
                    <button className="text-white hover:bg-white/20 rounded-full p-1 focus:outline-none">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              
              <div className="p-6">
                <CustomerForm 
                  onCustomerDataChange={handleCustomerDataChange}
                  onSaveRef={() => handleSaveCustomerChanges}
                />
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Dialog.Close asChild>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors">
                      Cancelar
                    </button>
                  </Dialog.Close>
                  
                  <button
                    onClick={handleSaveCustomerChanges}
                    className="bg-fiscal-green-500 hover:bg-fiscal-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors"
                  >
                    <Check size={18} className="mr-2" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
  
  return (
    <Layout>
      {content}
    </Layout>
  );
};

export default CustomersManagement; 