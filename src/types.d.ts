
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
  imageurl?: string;
  created_at?: string;
  updated_at?: string;
  stock?: number;
  images?: string[];
  additionalImages?: string[];
  code?: string;
  ncm?: string;
  unit?: string;
  quantity?: number;
  inStock?: boolean;
  category?: string;
  slug?: string;
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
  status: 'pending' | 'completed' | 'cancelled' | 'draft' | 'issued' | 'printed' | 'finalized' | 'canceled';
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
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  banner_image_url?: string;
  use_overlay_text?: boolean;
  logo?: string;
  logo_url?: string;
  shippingMethods?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  paymentMethods?: string[];
}

export type OrderStatus = 'entrada' | 'preparando' | 'saiu_para_entrega' | 'cancelado' | 'pendente' | 'producao';

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
