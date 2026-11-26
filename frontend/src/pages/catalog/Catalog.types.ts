import type { CatalogItem, ProductBatch, ProductCategory } from '../../core/types';

export interface CatalogTableProps {
  items: CatalogItem[];
  isPharmacy: boolean;
  onOpenStockModal: (item: CatalogItem) => void;
}

export interface AddProductModalProps {
  open: boolean;
  businessId: string;
  branchId: string;
  isPharmacy: boolean;
  categories: ProductCategory[];
  onClose: () => void;
  onCreated: () => void;
}

export interface StockMovementModalProps {
  item: CatalogItem | null;
  businessId: string;
  branchId: string;
  onClose: () => void;
  onRecorded: () => void;
}

export interface BatchExpiryTableProps {
  batches: ProductBatch[];
  onWriteOffExpired: (batch: ProductBatch) => void;
}
