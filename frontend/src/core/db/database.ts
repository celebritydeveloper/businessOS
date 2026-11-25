import Dexie, { type EntityTable } from 'dexie';

export interface SessionSnapshot {
  id: 'current';
  userId: string;
  accountId: string;
  fullName: string;
  isOwner: boolean;
  activeBusinessId: string | null;
  activeBranchId: string | null;
  businessesJson: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  graceUntil: string | null;
  updatedAt: string;
}

export interface LocalCatalogItem {
  id: string;
  branchId: string;
  businessId: string;
  sku: string;
  barcode: string;
  name: string;
  sellingPrice: number;
  isTaxExempt: boolean;
  trackBatches: boolean;
  stockQty: number;
  industryMetaJson: string;
}

export interface LocalItemBatch {
  id: string;
  branchId: string;
  itemId: string;
  batchNumber: string;
  expiryDate: string;
  quantityRemaining: number;
}

export interface SyncOutboxEvent {
  id: string; // Client UUIDv4 (idempotency event_id)
  branchId: string;
  eventType: 'sale.created' | 'inventory.adjusted' | 'audit.logged';
  payloadJson: string;
  status: 'pending' | 'syncing' | 'synced' | 'conflict';
  occurredAt: string;
  retryCount: number;
  errorMessage?: string;
}

class BusinessOSDatabase extends Dexie {
  sessionSnapshot!: EntityTable<SessionSnapshot, 'id'>;
  catalogItems!: EntityTable<LocalCatalogItem, 'id'>;
  itemBatches!: EntityTable<LocalItemBatch, 'id'>;
  syncOutbox!: EntityTable<SyncOutboxEvent, 'id'>;

  constructor() {
    super('BusinessOS_LocalDB');
    this.version(1).stores({
      sessionSnapshot: 'id',
      catalogItems: 'id, branchId, barcode, sku, name',
      itemBatches: 'id, branchId, itemId, expiryDate',
      syncOutbox: 'id, branchId, status, occurredAt',
    });
  }
}

export const localDb = new BusinessOSDatabase();
