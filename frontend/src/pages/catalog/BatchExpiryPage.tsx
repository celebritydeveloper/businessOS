import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, Pill } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { CatalogListResponse, ProductBatch, StockMovementPayload } from '../../core/types';
import { StatCard } from '../../shared/ui/StatCard';
import { toast } from '../../shared/ui/ToastProvider';
import { BatchExpiryTable } from './BatchExpiryTable';

export function BatchExpiryPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBatches = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const res = await apiFetch<CatalogListResponse>(
      `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/catalog`
    );
    if (res.ok && res.body.data) {
      setBatches(res.body.data.batches);
    }
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const handleWriteOff = async (batch: ProductBatch) => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    const payload: StockMovementPayload = {
      catalog_item_id: batch.catalog_item_id,
      movement_type: 'expired_writeoff',
      quantity_delta: -Math.abs(Number(batch.quantity_remaining)),
      unit_cost: Number(batch.cost_price),
      batch_number: batch.batch_number,
      idempotency_key: `writeoff-${batch.id}-${Date.now()}`,
      notes: `Expired batch write-off (${batch.batch_number})`,
    };

    const res = await apiFetch(
      `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/stock-movements`,
      { method: 'POST', body: JSON.stringify(payload) }
    );

    if (!res.ok) {
      toast.error(res.body.message || 'Could not write off expired batch.', 'Error');
      return;
    }

    toast.success(`Expired batch ${batch.batch_number} written off.`, 'Inventory Updated');
    void loadBatches();
  };

  const summary = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    for (const b of batches) {
      const days = Number(b.days_to_expiry ?? 999);
      if (days < 0) expired++;
      else if (days <= 30) expiringSoon++;
    }
    return { expired, expiringSoon };
  }, [batches]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pharmacy Batch &amp; FEFO Expiry Monitor</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          First-Expired, First-Out (FEFO) batch tracking for <strong>{activeBranch?.name}</strong>. Expired lots are automatically blocked at POS.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Batches" value={batches.length} subtitle="Tracked lots in branch" icon={Pill} />
        <StatCard
          label="Expiring Within 30 Days"
          value={summary.expiringSoon}
          subtitle="Dispensed first via FEFO"
          icon={Clock}
          iconColorClass="text-amber-500"
        />
        <StatCard
          label="Expired Lots"
          value={summary.expired}
          subtitle="Blocked from sale — ready for write-off"
          icon={AlertCircle}
          iconColorClass="text-red-600"
        />
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading batch expiry ledger...</div>
      ) : (
        <BatchExpiryTable batches={batches} onWriteOffExpired={handleWriteOff} />
      )}
    </div>
  );
}
