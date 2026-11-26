import { useState, type FormEvent } from 'react';
import { ReceiptText, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { Branch } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { TrialBalanceAccount } from './Accounting.types';

interface RecordExpenseModalProps {
  open: boolean;
  businessId: string;
  branches: Branch[];
  expenseAccounts: TrialBalanceAccount[];
  onClose: () => void;
  onRecorded: () => void;
}

export function RecordExpenseModal({
  open,
  businessId,
  branches,
  expenseAccounts,
  onClose,
  onRecorded,
}: RecordExpenseModalProps) {
  const [branchId, setBranchId] = useState(branches.at(0)?.id || '');
  const [expenseCode, setExpenseCode] = useState(expenseAccounts.at(0)?.code || '');
  const [paymentCode, setPaymentCode] = useState<'1000' | '1010'>('1000');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const activeAccount = expenseAccounts.find((a) => a.code === (expenseCode || expenseAccounts.at(0)?.code));
  

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/accounting/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        branch_id: branchId || branches.at(0)?.id || '',
        expense_account_code: expenseCode || expenseAccounts.at(0)?.code || '',
        payment_account_code: paymentCode,
        amount: parseFloat(amount) || 0,
        expense_date: expenseDate,
        description: description.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not record expense.', 'Expense Error');
      return;
    }

    toast.success('Operating expense posted to General Ledger.', 'Expense Recorded');
    setAmount('');
    setDescription('');
    onRecorded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Record Operating Expense</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Branch</label>
              <select
                value={branchId || branches.at(0)?.id || ''}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <Input label="Expense Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Expense Category (Ledger Account)</label>
            <select
              value={expenseCode || expenseAccounts.at(0)?.code || ''}
              onChange={(e) => setExpenseCode(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
            >
              {expenseAccounts.map((acc) => (
                <option key={acc.code} value={acc.code}>{acc.code} — {acc.name}</option>
              ))}
            </select>
            {activeAccount?.description && (
                <div className="bg-blue-100 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                    <p className="text-[11px] text-slate-600">
                        <strong>Includes:</strong> {activeAccount?.description}
                    </p>
                </div>
                
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₦)" type="number" step="0.01" min="1" placeholder="15000" value={amount} onChange={(e) => setAmount(e.target.value)} required />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Paid From</label>
              <select
                value={paymentCode}
                onChange={(e) => setPaymentCode(e.target.value as '1000' | '1010')}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="1000">1000 — Cash in Hand</option>
                <option value="1010">1010 — Bank / Transfer</option>
              </select>
            </div>
          </div>

          <Input label="Description / Vendor" placeholder="e.g., Diesel for generator (50L)" value={description} onChange={(e) => setDescription(e.target.value)} required />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Add Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
