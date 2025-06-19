


export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
  app_metadata?: {
    seller_id?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EcommerceProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  stock?: number;
  images?: string[];
  additionalImages?: string[];
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  created_at?: string;
}

export interface FiscalNote {
  id: string;
  customer_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'draft' | 'issued' | 'printed' | 'finalized';
  created_at?: string;
}

export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'check' | 'transfer' | 'other' | 'bank_transfer' | 'store_credit' | 'installment_plan' | 'mobile_payment' | 'money_order' | 'voucher';

export interface PaymentData {
  method: PaymentMethod;
  installments: number;
  total: number;
}

export interface StoreInfo {
  id?: string;
  store_name?: string;
  name?: string;
  user_id?: string;
  owner_id?: string;
  ownerId?: string;
  shippingMethods?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  paymentMethods?: string[];
}

export type OrderStatus = 'entrada' | 'producao' | 'entrega' | 'finalizado';

export interface NewOrderKanbanData {
  product_id: string;
  product_name: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  status: OrderStatus;
  notes: string;
  total_amount: number;
}
