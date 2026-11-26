import { useState, type FormEvent } from 'react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { CustomerItem } from './Contacts.types';

interface CustomerRepaymentModalProps {
  customer: CustomerItem | null;
  businessId: string;
  branchId: string;
  onClose: () => void;
  onRecorded: () => void;
}

export function CustomerRepaymentModal({
  customer,
  businessId,
  branchId,
  onClose,
  onRecorded,
}: CustomerRepaymentModalProps) {
  const [amount, setAmount] = useState(customer ? String(customer.credit_balance) : '');
  const [payMethod, setPayMethod] = useState<'1000' | '1010'>('1010');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(
      `/workspace/businesses/${businessId}/customers/${customer.id}/payments`,
      {
        method: 'POST',
        body: JSON.stringify({
          branch_id: branchId,
          amount: parseFloat(amount) || 0,
          payment_account_code: payMethod,
          notes: notes.trim(),
        }),
      }
    );
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not record repayment.', 'Error');
      return;
    }

    toast.success('Credit repayment posted to General Ledger!', 'Payment Recorded');
    setNotes('');
    onRecorded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">
          Record Debt Repayment — {customer.full_name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Amount Paid (₦)"
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Received Into</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as '1000' | '1010')}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
            >
              <option value="1010">1010 — Bank / Transfer</option>
              <option value="1000">1000 — Cash on Hand</option>
            </select>
          </div>
          <Input
            label="Reference / Note"
            placeholder="Transfer ref or receipt note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Confirm Repayment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
