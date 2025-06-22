export type ActionType = 'in' | 'out';

export interface Product {
  item_code: string;
  item_name: string;
  item_quantity?: number;
  current_stock?: number;
  updated_at: string;
  updated_by: string;
} 

export interface Supplier {
  supplier_code: string;
  supplier_name: string;
  supplier_type: string;
  supplier_address?: string;
  supplier_description?: string;
  updated_at?: string;
  updated_by: string;
}

export interface Transaction {
  id?: number;
  item_code: string;
  item_name?: string;
  supplier_code?: string;
  supplier_name?: string;
  action: string;
  quantity: number;
  price?: number;
  updated_at?: string;
  updated_by: string;
}