import { apiFetch } from '../api/httpClient';
import { localDb } from '../db/database';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
}

type Listener = (status: SyncStatus) => void;

class SyncEngine {
  private state: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    conflictCount: 0,
    lastSyncedAt: null,
  };
  private listeners = new Set<Listener>();
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener('online', () => {
      this.update({ isOnline: true });
      void this.flushOutbox();
    });

    window.addEventListener('offline', () => {
      this.update({ isOnline: false });
    });

    void this.refreshCounts();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async refreshCounts(): Promise<void> {
    const pendingCount = await localDb.syncOutbox.where('status').equals('pending').count();
    const conflictCount = await localDb.syncOutbox.where('status').equals('conflict').count();
    this.update({ pendingCount, conflictCount });
  }

  async flushOutbox(): Promise<void> {
    if (!this.state.isOnline || this.state.isSyncing) return;

    const pending = await localDb.syncOutbox.where('status').equals('pending').sortBy('occurredAt');
    if (pending.length === 0) {
      await this.refreshCounts();
      return;
    }

    this.update({ isSyncing: true });
    try {
      const res = await apiFetch<{ processed_ids?: string[]; conflict_ids?: string[] }>('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ events: pending }),
      });

      if (res.ok && res.body.data) {
        const processed = new Set(res.body.data.processed_ids || []);
        const conflicts = new Set(res.body.data.conflict_ids || []);

        for (const item of pending) {
          if (processed.has(item.id)) {
            await localDb.syncOutbox.update(item.id, { status: 'synced' });
          } else if (conflicts.has(item.id)) {
            await localDb.syncOutbox.update(item.id, { status: 'conflict' });
          }
        }
        this.update({ lastSyncedAt: new Date().toISOString() });
      }
    } finally {
      this.update({ isSyncing: false });
      await this.refreshCounts();
    }
  }

  private update(patch: Partial<SyncStatus>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const syncEngine = new SyncEngine();
