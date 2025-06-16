export interface CompanyData {
  name?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export interface InstallmentFee {
  installments: number;
  fee: number;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export interface DeliveryRadius {
  radius: number;
  fee: number;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export interface DeliverySettings {
  delivery_radii: DeliveryRadius[];
  default_delivery_fee?: number;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export interface PrinterSettings {
  default_printer: string;
  auto_print: boolean;
  [key: string]: any; // Allow additional properties for JSON compatibility
}

export interface UserSettings {
  id?: string;
  user_id?: string;
  company_data: CompanyData;
  installment_fees: InstallmentFee[];
  delivery_settings: DeliverySettings;
  printer_settings: PrinterSettings;
  created_at?: string;
  updated_at?: string;
} 