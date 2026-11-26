export type ItemType = 'product' | 'service';

export type StockMovementType =
  | 'opening_stock'
  | 'restock'
  | 'sale'
  | 'adjustment'
  | 'return'
  | 'expired_writeoff'
  | 'transfer_out'
  | 'transfer_in';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogItem {
  id: string;
  business_id: string;
  category_id: string | null;
  category_name?: string | null;
  item_type: ItemType;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit_label: string;
  cost_price: number;
  selling_price: number;
  is_vat_exempt: boolean | number;
  track_batches: boolean | number;
  reorder_level: number;
  quantity_on_hand: number;
}

export interface ProductBatch {
  id: string;
  branch_id: string;
  catalog_item_id: string;
  item_name?: string;
  batch_number: string;
  expiry_date: string;
  cost_price: number;
  quantity_remaining: number;
  days_to_expiry?: number;
}

export interface CatalogListResponse {
  categories: ProductCategory[];
  items: CatalogItem[];
  batches: ProductBatch[];
}

export interface CreateCatalogItemPayload {
  category_id?: string | null;
  item_type: ItemType;
  name: string;
  sku?: string;
  barcode?: string;
  unit_label: string;
  cost_price: number;
  selling_price: number;
  is_vat_exempt: boolean;
  track_batches: boolean;
  reorder_level: number;
  branch_id?: string;
  opening_stock?: number;
  batch_number?: string;
  expiry_date?: string;
}

export interface StockMovementPayload {
  catalog_item_id: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  unit_cost?: number;
  batch_number?: string;
  expiry_date?: string;
  idempotency_key: string;
  notes?: string;
}
