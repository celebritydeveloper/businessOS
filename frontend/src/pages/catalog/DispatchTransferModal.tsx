import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { DispatchTransferModalProps } from './StockTransfer.types';

export function DispatchTransferModal({
  open,
  businessId,
  fromBranch,
  branches,
  items,
  batches,
  onClose,
  onDispatched,
}: DispatchTransferModalProps) {
  const destinationBranches = branches.filter((b) => b.id !== fromBranch.id);
  const [toBranchId, setToBranchId] = useState(destinationBranches.at(0)?.id || '');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedBatchNo, setSelectedBatchNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const isBatchTracked = Boolean(Number(selectedItem?.track_batches));
  const itemBatches = batches.filter((b) => b.catalog_item_id === selectedItemId && Number(b.quantity_remaining) > 0);
  const chosenBatch = itemBatches.find((b) => b.batch_number === selectedBatchNo);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!toBranchId || !selectedItem) return;

    setSubmitting(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/transfers`, {
      method: 'POST',
      body: JSON.stringify({
        from_branch_id: fromBranch.id,
        to_branch_id: toBranchId,
        notes: notes.trim(),
        items: [
          {
            catalog_item_id: selectedItem.id,
            batch_number: isBatchTracked ? selectedBatchNo : '',
            expiry_date: isBatchTracked ? chosenBatch?.expiry_date || '' : '',
            unit_cost: Number(selectedItem.cost_price || 0),
            quantity: parseFloat(quantity) || 0,
          },
        ],
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not dispatch stock transfer.', 'Transfer Failed');
      return;
    }

    toast.success('Stock dispatched! Destination branch can now confirm receipt.', 'In Transit');
    setSelectedItemId('');
    setSelectedBatchNo('');
    setQuantity('');
    setNotes('');
    onDispatched();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Dispatch Stock Transfer</h2>
            <p className="text-xs text-slate-500">From: <strong>{fromBranch.name}</strong></p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Destination Branch</label>
            <select
              value={toBranchId}
              onChange={(e) => setToBranchId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              required
            >
              <option value="">Select receiving branch...</option>
              {destinationBranches.map((br) => (
                <option key={br.id} value={br.id}>{br.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Product to Transfer</label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setSelectedBatchNo('');
              }}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              required
            >
              <option value="">Choose item...</option>
              {items
                .filter((i) => i.item_type === 'product' && Number(i.quantity_on_hand) > 0)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Avail: {i.quantity_on_hand} {i.unit_label})
                  </option>
                ))}
            </select>
          </div>

          {isBatchTracked && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Source Batch</label>
              <select
                value={selectedBatchNo}
                onChange={(e) => setSelectedBatchNo(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                required
              >
                <option value="">Select batch...</option>
                {itemBatches.map((b) => (
                  <option key={b.id} value={b.batch_number}>
                    {b.batch_number} — Exp {b.expiry_date} ({b.quantity_remaining} left)
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input label="Quantity to Send" type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Input label="Dispatch Note (Optional)" placeholder="e.g., Weekly sub-branch restock" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={submitting} disabled={destinationBranches.length === 0}>
              Dispatch Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
