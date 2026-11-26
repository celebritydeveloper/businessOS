import type { BusinessBranding, CatalogItem, ProductCategory } from '../../core/types';

export type PaymentMethodType = 'cash' | 'pos_card' | 'transfer';

export interface PosCartItem {
  catalog_item_id: string;
  name: string;
  unit_label: string;
  unit_price: number;
  quantity: number;
  is_vat_exempt: boolean;
  max_stock: number | null;
}

export interface SalePaymentSplit {
  method: PaymentMethodType;
  amount: number;
  reference?: string;
}

export interface CompletedReceiptData {
  receipt_number: string;
  sold_at: string;
  business_name: string;
  branch_name: string;
  customer_name?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    vat_amount: number;
    line_total: number;
  }>;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  grand_total: number;
  amount_paid: number;
  change_due: number;
  payments: SalePaymentSplit[];
  branding?: BusinessBranding | null;
  show_powered_by: boolean;
  offline_queued?: boolean;
}

export interface SaleHistoryItem {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  grand_total: number;
  amount_paid: number;
  change_due: number;
  cashier_name: string | null;
  sold_at: string;
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    vat_amount: number;
    line_total: number;
  }>;
  payments: SalePaymentSplit[];
}

export interface SalesListResponse {
  sales: SaleHistoryItem[];
}

export interface PosProductGridProps {
  items: CatalogItem[];
  categories: ProductCategory[];
  search: string;
  selectedCategory: string;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onAddToCart: (item: CatalogItem) => void;
}

export interface PosCartPanelProps {
  cart: PosCartItem[];
  discount: number;
  isVatRegistered: boolean;
  defaultVatRate: number;
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onDiscountChange: (val: number) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export interface SplitPaymentModalProps {
  open: boolean;
  grandTotal: number;
  submitting: boolean;
  onClose: () => void;
  onConfirmSale: (payments: SalePaymentSplit[], customerName: string, customerPhone: string) => void;
}

export interface ThermalReceiptModalProps {
  receipt: CompletedReceiptData | null;
  onClose: () => void;
}
