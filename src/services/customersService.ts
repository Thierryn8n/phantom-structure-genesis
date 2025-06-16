import { supabase } from '@/integrations/supabase/client';
import { Customer, CustomerFilters, PaginatedResponse } from '@/types/Customer';

/* 
 * Serviço de Clientes - Parte do sistema Fiscal Flow
 * Visual de grade (grid lines) aplicado nas páginas para melhor organização visual
 */
export class CustomersService {
  // Tabela no Supabase
  private static readonly TABLE_NAME = 'customers';

  /**
   * Salva um novo cliente ou atualiza um existente
   */
  static async saveCustomer(customer: Customer): Promise<Customer | null> {
    try {
      // Tentar renovar a sessão antes de fazer a chamada
      try {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          console.log("Tentativa de renovação de sessão não retornou uma nova sessão");
        } else {
          console.log("Sessão renovada antes de salvar cliente");
        }
      } catch (refreshError) {
        console.warn("Erro ao tentar renovar sessão:", refreshError);
      }

      // Certifique-se de que temos um ownerId
      if (!customer.ownerId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user?.id) {
          console.error("Erro de autenticação: Usuário não está autenticado ou sessão expirada");
          throw new Error('Usuário não autenticado ou sessão expirada');
        }
        customer.ownerId = sessionData.session.user.id;
      }
      
      // Verificar se o cliente já existe (tem ID)
      if (customer.id) {
        // Formatar os dados para o formato do Supabase
        const supabaseData = {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          signature: customer.signature
        };

        // Atualizar cliente existente
        const { data, error } = await supabase
          .from(this.TABLE_NAME)
          .update(supabaseData)
          .eq('id', customer.id)
          .select('*')
          .single();

        if (error) {
          if (error.code === '401') {
            console.error("Erro de autenticação 401: Token de acesso inválido ou expirado");
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
          throw error;
        }
        
        return this.mapCustomerFromSupabase(data);
      } else {
        // Formatar para inserção no Supabase
        const supabaseData = {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          signature: customer.signature,
          owner_id: customer.ownerId
        };

        // Inserir novo cliente
        const { data, error } = await supabase
          .from(this.TABLE_NAME)
          .insert(supabaseData)
          .select('*')
          .single();

        if (error) {
          if (error.code === '401') {
            console.error("Erro de autenticação 401: Token de acesso inválido ou expirado");
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
          throw error;
        }
        
        return this.mapCustomerFromSupabase(data);
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error; // Propagar o erro para permitir melhor tratamento no componente
    }
  }

  /**
   * Busca todos os clientes com base nos filtros
   */
  static async getCustomers(
    filters?: CustomerFilters
  ): Promise<PaginatedResponse<Customer>> {
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      
      // Verificar usuário autenticado
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' });
      
      // Aplicar filtro de termo de busca
      if (filters?.searchTerm) {
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`
        );
      }
      
      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('name', { ascending: true })
        .range(from, to);
      
      // Executar a consulta
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const customers = data?.map(this.mapCustomerFromSupabase) || [];
      const totalCount = count || 0;
      
      return {
        data: customers,
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return {
        data: [],
        count: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      };
    }
  }

  /**
   * Busca um cliente específico pelo ID
   */
  static async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return this.mapCustomerFromSupabase(data);
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      return null;
    }
  }

  /**
   * Exclui um cliente
   */
  static async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      return false;
    }
  }

  /**
   * Busca clientes por termo de pesquisa
   */
  static async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      // Verificar usuário autenticado
      const session = await supabase.auth.getSession();
      if (!session.data.session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      // Usar a função RPC personalizada para buscar clientes
      const { data, error } = await supabase
        .rpc('search_customers', {
          p_owner_id: session.data.session.user.id,
          p_search_term: searchTerm
        });
      
      if (error) throw error;
      
      return data?.map((item: any) => this.mapCustomerFromSupabase(item)) || [];
    } catch (error) {
      console.error('Erro ao buscar clientes por termo:', error);
      return [];
    }
  }
  
  /**
   * Busca um cliente pelo nome e telefone. Se não encontrar, cria um novo.
   * Usado ao salvar ou imprimir a nota fiscal quando o usuário não salva o cliente explicitamente.
   */
  static async findOrCreateCustomer(customerData: { 
    name: string; 
    phone: string; 
    email?: string;
    address?: any;
    signature?: string;
    ownerId: string;
  }): Promise<Customer | null> {
    try {
      if (!customerData.name || !customerData.phone) {
        console.error("Nome e telefone são obrigatórios para salvar/encontrar cliente");
        return null;
      }

      // Verificar se a sessão está válida
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Tentar renovar a sessão
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          console.error("Sessão expirada, não é possível salvar o cliente");
          return null;
        }
      }

      // Buscar clientes pelo nome (exato) e telefone
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('name', customerData.name)
        .eq('phone', customerData.phone)
        .eq('owner_id', customerData.ownerId)
        .single();

      if (error) {
        // Se for erro de "not found", vamos criar um novo cliente
        if (error.code === 'PGRST116') {
          // Cliente não encontrado, criar um novo
          return this.saveCustomer({
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address || {},
            signature: customerData.signature,
            ownerId: customerData.ownerId
          });
        }
        // Se for outro erro, propagar
        throw error;
      }

      // Cliente encontrado, retornar
      return this.mapCustomerFromSupabase(data);
    } catch (error) {
      console.error('Erro ao buscar/criar cliente:', error);
      return null;
    }
  }
  
  /**
   * Mapeia os dados do Supabase para o formato do aplicativo
   */
  private static mapCustomerFromSupabase(data: any): Customer {
    if (!data) return null as any;
    
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      signature: data.signature,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
} 