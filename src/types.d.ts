
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
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
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
}
