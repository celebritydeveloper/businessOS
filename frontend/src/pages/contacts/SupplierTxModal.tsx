import { useState, type FormEvent } from 'react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { SupplierItem } from './Contacts.types';

interface SupplierTxModalProps {
  supplier: SupplierItem | null;
  txType: 'supplier_bill' | 'supplier_payment';
  businessId: string;
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SupplierTxModal({
  supplier,
  txType,
  businessId,
  branchId,
  onClose,
  onSaved,
}: SupplierTxModalProps) {
  const [amount, setAmount] = useState(
    supplier && txType === 'supplier_payment' ? String(supplier.payable_balance) : ''
  );
  const [payAccount, setPayAccount] = useState<'1010' | '1000'>('1010');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!supplier) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(
      `/workspace/businesses/${businessId}/suppliers/${supplier.id}/transactions`,
      {
        method: 'POST',
        body: JSON.stringify({
          branch_id: branchId,
          tx_type: txType,
          amount: parseFloat(amount) || 0,
          payment_account_code: payAccount,
          notes: notes.trim(),
        }),
      }
    );
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not post supplier transaction.', 'Error');
      return;
    }

    toast.success(
      txType === 'supplier_bill' ? 'Supplier credit bill logged!' : 'Supplier payment recorded!',
      'Ledger Updated'
    );
    setNotes('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">
          {txType === 'supplier_bill' ? 'Log Supplier Credit Bill' : 'Record Supplier Payout'} — {supplier.name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Amount (₦)"
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {txType === 'supplier_payment' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Paid From</label>
              <select
                value={payAccount}
                onChange={(e) => setPayAccount(e.target.value as '1010' | '1000')}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="1010">1010 — Bank / Transfer</option>
                <option value="1000">1000 — Cash on Hand</option>
              </select>
            </div>
          )}
          <Input
            label="Invoice / Waybill Note"
            placeholder="e.g., 30 bags broiler finisher on 14-day credit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>
              {txType === 'supplier_bill' ? 'Save Credit Bill' : 'Confirm Payout'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
