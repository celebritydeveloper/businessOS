export interface CustomerItem {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number | string;
  credit_balance: number | string;
  total_spent: number | string;
  notes: string | null;
}

export interface SupplierItem {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_details: string | null;
  payable_balance: number | string;
  total_purchased: number | string;
  notes: string | null;
}
