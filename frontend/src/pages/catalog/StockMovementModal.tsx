import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { StockMovementPayload, StockMovementType } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { StockMovementModalProps } from './Catalog.types';

export function StockMovementModal({ item, businessId, branchId, onClose, onRecorded }: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<'restock' | 'adjustment_out'>('restock');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const isBatchTracked = Boolean(Number(item.track_batches));
  const isAddition = movementType === 'restock';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const rawQty = Math.abs(parseFloat(quantity) || 0);
    if (rawQty <= 0) return;

    setSaving(true);
    const payload: StockMovementPayload = {
      catalog_item_id: item.id,
      movement_type: (isAddition ? 'restock' : 'adjustment') as StockMovementType,
      quantity_delta: isAddition ? rawQty : -rawQty,
      unit_cost: parseFloat(unitCost) || Number(item.cost_price),
      batch_number: batchNumber.trim(),
      expiry_date: expiryDate,
      idempotency_key: `stock-${crypto.randomUUID()}`,
      notes: notes.trim(),
    };

    const res = await apiFetch(`/workspace/businesses/${businessId}/branches/${branchId}/stock-movements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not record stock update.', 'Stock Error');
      return;
    }

    toast.success(`Stock updated for ${item.name}.`, 'Ledger Updated');
    setQuantity('');
    setBatchNumber('');
    setExpiryDate('');
    setNotes('');
    onRecorded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Update Branch Stock</h2>
            <p className="text-xs text-slate-500">{item.name} (Current: {item.quantity_on_hand} {item.unit_label})</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMovementType('restock')}
              className={`py-2 rounded-lg cursor-pointer ${isAddition ? 'bg-white text-brand-600 shadow-2xs' : 'text-slate-600'}`}
            >
              + Restock Intake
            </button>
            <button
              type="button"
              onClick={() => setMovementType('adjustment_out')}
              className={`py-2 rounded-lg cursor-pointer ${!isAddition ? 'bg-white text-red-600 shadow-2xs' : 'text-slate-600'}`}
            >
              - Stock Deduction
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label={`Quantity (${item.unit_label})`} type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <Input label="Unit Cost (₦)" type="number" step="0.01" placeholder={String(item.cost_price)} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          </div>

          {isBatchTracked && (
            <div className="grid grid-cols-2 gap-3">
              <Input label={isAddition ? 'Batch Number' : 'Batch # (Optional)'} placeholder="BN-2026B" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required={isAddition} />
              {isAddition && (
                <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
              )}
            </div>
          )}

          <Input label="Notes / Supplier Invoice #" placeholder="e.g., Emzor Wholesale Delivery" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Record Movement</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
