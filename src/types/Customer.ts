// Interface para o endereço do cliente
export interface CustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Interface principal para clientes
export interface Customer {
  id?: string;           // ID gerado pelo banco de dados (opcional para novos clientes)
  name: string;          // Nome completo do cliente
  phone: string;         // Telefone do cliente
  email?: string;        // Email do cliente (opcional)
  address: CustomerAddress; // Endereço completo
  signature?: string;    // Assinatura em formato Base64 (opcional)
  ownerId?: string;      // ID do proprietário da conta
  createdAt?: string;    // Data de criação no banco
  updatedAt?: string;    // Data da última atualização
}

// Interface para filtros de busca de clientes
export interface CustomerFilters {
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 