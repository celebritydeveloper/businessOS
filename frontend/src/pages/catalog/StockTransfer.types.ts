import type { Branch, CatalogItem, ProductBatch } from '../../core/types';

export interface StockTransferLine {
  id: string;
  transfer_id: string;
  catalog_item_id: string;
  item_name: string;
  batch_number: string | null;
  expiry_date: string | null;
  unit_cost: number;
  quantity: number;
}

export interface StockTransferRecord {
  id: string;
  business_id: string;
  from_branch_id: string;
  to_branch_id: string;
  from_branch_name: string;
  to_branch_name: string;
  status: 'in_transit' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
  received_at: string | null;
  items: StockTransferLine[];
}

export interface StockTransfersListResponse {
  transfers: StockTransferRecord[];
}

export interface DispatchTransferModalProps {
  open: boolean;
  businessId: string;
  fromBranch: Branch;
  branches: Branch[];
  items: CatalogItem[];
  batches: ProductBatch[];
  onClose: () => void;
  onDispatched: () => void;
}
