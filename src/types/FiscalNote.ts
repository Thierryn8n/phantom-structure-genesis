// Tipos para produtos em uma nota fiscal
export interface NoteProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

// Tipo para endereço do cliente
export interface CustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Tipo para os dados do cliente
export interface CustomerData {
  name: string;
  address: CustomerAddress;
  phone: string;
  email?: string;
}

// Tipo para dados de pagamento
export interface PaymentData {
  method: 'cash' | 'credit' | 'debit' | 'transfer' | 'pix' | 'check' | 'other';
  installments: number;
  dueDate?: string;
  observation?: string;
  paid?: boolean;
  paidAt?: string;
}

// Status possíveis para uma nota fiscal
export type NoteStatus = 'draft' | 'issued' | 'printed' | 'canceled' | 'finalized';

// Interface principal para a nota fiscal
export interface FiscalNote {
  id?: string;           // ID gerado pelo banco de dados (opcional para novas notas)
  noteNumber: string;    // Número da nota (gerado pela aplicação)
  date: string;          // Data de emissão
  products: NoteProduct[]; // Lista de produtos
  customerData: CustomerData; // Dados do cliente
  paymentData: PaymentData;   // Dados de pagamento
  totalValue: number;    // Valor total
  status: NoteStatus;    // Status da nota
  sellerId?: string;     // ID do vendedor que criou a nota (se aplicável)
  sellerName?: string;   // Nome do vendedor (opcional)
  ownerId: string;       // ID do proprietário da conta
  createdAt?: string;    // Data de criação no banco
  updatedAt?: string;    // Data da última atualização
  printedAt?: string;    // Data da última impressão
}

// Interface para filtros de consulta de notas
export interface NoteFilters {
  startDate?: string;
  endDate?: string;
  status?: NoteStatus | NoteStatus[];
  sellerId?: string;
  customerId?: string;
  minValue?: number;
  maxValue?: number;
  searchTerm?: string;
}

// Interface para resumo estatístico de notas
export interface NotesSummary {
  totalCount: number;
  totalValue: number;
  byStatus: Record<NoteStatus, number>;
  bySeller?: Record<string, { count: number; value: number }>;
  byPaymentMethod?: Record<string, { count: number; value: number }>;
} 