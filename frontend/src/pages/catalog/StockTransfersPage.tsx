import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Send } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { CatalogItem, CatalogListResponse, ProductBatch } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import { DispatchTransferModal } from './DispatchTransferModal';
import type { StockTransferRecord, StockTransfersListResponse } from './StockTransfer.types';

export function StockTransfersPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [transfers, setTransfers] = useState<StockTransferRecord[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const hasMultipleBranches = (activeBusiness?.branches.length ?? 0) > 1;

  const loadAll = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const [trRes, catRes] = await Promise.all([
      apiFetch<StockTransfersListResponse>(`/workspace/businesses/${activeBusiness.id}/transfers`),
      apiFetch<CatalogListResponse>(`/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/catalog`),
    ]);

    if (trRes.ok && trRes.body.data) setTransfers(trRes.body.data.transfers);
    if (catRes.ok && catRes.body.data) {
      setItems(catRes.body.data.items);
      setBatches(catRes.body.data.batches);
    }
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleConfirmReceipt = async (transferId: string) => {
    if (!activeBusiness?.id) return;
    setReceivingId(transferId);
    const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/transfers/${transferId}/receive`, {
      method: 'POST',
    });
    setReceivingId(null);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not confirm receipt.', 'Error');
      return;
    }

    toast.success('Stock received and credited to branch inventory.', 'Received');
    void loadAll();
  };

  if (!activeBusiness || !activeBranch) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Branch Stock Transfers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Move inventory between branches of <strong>{activeBusiness.name}</strong> with receipt verification.
          </p>
        </div>

        {hasMultipleBranches && (
          <Button type="button" onClick={() => setDispatchOpen(true)}>
            <Send className="w-4 h-4" /> Dispatch Stock
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading branch transfers...</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          No stock transfers recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((tr) => {
                  const canReceive = tr.status === 'in_transit' && tr.to_branch_id === activeBranch.id;
                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          {tr.from_branch_name} <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" /> {tr.to_branch_name}
                        </span>
                        {tr.notes && <p className="text-[11px] font-normal text-slate-400 mt-0.5">{tr.notes}</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {tr.items.map((line) => (
                          <div key={line.id}>
                            <strong>{line.quantity}</strong> &times; {line.item_name}
                            {line.batch_number ? ` (Batch ${line.batch_number})` : ''}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tr.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            tr.status === 'received' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {tr.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canReceive && (
                          <Button
                            type="button"
                            isLoading={receivingId === tr.id}
                            onClick={() => void handleConfirmReceipt(tr.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Receipt
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasMultipleBranches && (
        <DispatchTransferModal
          open={dispatchOpen}
          businessId={activeBusiness.id}
          fromBranch={activeBranch}
          branches={activeBusiness.branches}
          items={items}
          batches={batches}
          onClose={() => setDispatchOpen(false)}
          onDispatched={() => void loadAll()}
        />
      )}
    </div>
  );
}
