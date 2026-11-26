import { useEffect, useState, type FormEvent } from 'react';
import { ReceiptText, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { getIndustryCapabilities } from '../../core/config/industryCapabilities';
import type { Branch } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { FarmCycleItem } from '../agriculture/Agriculture.types';
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
  const { activeBusiness } = useAuth();
  const caps = getIndustryCapabilities(activeBusiness?.industry_type);

  const [branchId, setBranchId] = useState(branches.at(0)?.id || '');
  const [expenseCode, setExpenseCode] = useState(expenseAccounts.at(0)?.code || '');
  const [paymentCode, setPaymentCode] = useState<'1000' | '1010'>('1000');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [farmCycleId, setFarmCycleId] = useState('');
  const [activeCycles, setActiveCycles] = useState<FarmCycleItem[]>([]);
  const [saving, setSaving] = useState(false);

  const resolvedBranchId = branchId || branches.at(0)?.id || '';
  const activeAccount = expenseAccounts.find((a) => a.code === (expenseCode || expenseAccounts.at(0)?.code));

  useEffect(() => {
    if (!open || !caps.supportsFarmCycles || !businessId || !resolvedBranchId) {
      setActiveCycles([]);
      setFarmCycleId('');
      return;
    }

    apiFetch<{ cycles: FarmCycleItem[] }>(
      `/workspace/businesses/${businessId}/branches/${resolvedBranchId}/farm-cycles`
    ).then((res) => {
      if (res.ok && res.body.data) {
        setActiveCycles(res.body.data.cycles.filter((c) => c.status === 'active'));
      }
    });
  }, [open, caps.supportsFarmCycles, businessId, resolvedBranchId]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/accounting/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        branch_id: resolvedBranchId,
        expense_account_code: expenseCode || expenseAccounts.at(0)?.code || '',
        payment_account_code: paymentCode,
        amount: parseFloat(amount) || 0,
        expense_date: expenseDate,
        description: description.trim(),
        farm_cycle_id: caps.supportsFarmCycles ? farmCycleId : '',
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not record expense.', 'Expense Error');
      return;
    }

    toast.success(
      farmCycleId
        ? 'Expense added to Farm Cycle production cost & General Ledger!'
        : 'Operating expense posted to General Ledger.',
      'Expense Recorded'
    );
    setAmount('');
    setDescription('');
    setFarmCycleId('');
    onRecorded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
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
                value={resolvedBranchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setFarmCycleId('');
                }}
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
              <div className="bg-blue-50 border border-blue-200/80 rounded-lg px-2.5 py-1.5">
                <p className="text-[11px] text-slate-600">
                  <strong>Includes:</strong> {activeAccount.description}
                </p>
              </div>
            )}
          </div>

          {caps.supportsFarmCycles && activeCycles.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <label className="block text-xs font-bold text-emerald-950">
                Assign to Active Farm Cycle (Optional)
              </label>
              <select
                value={farmCycleId}
                onChange={(e) => setFarmCycleId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-emerald-200 bg-white text-sm"
              >
                <option value="">General Farm Overhead (Not tied to a specific batch)</option>
                {activeCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.species_or_crop})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-800">
                Linked expenses roll into that cycle&apos;s harvest production cost (COGS) without double-counting.
              </p>
            </div>
          )}

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

          <Input label="Description / Vendor" placeholder="e.g., Casual weeding labor — Maize Plot 2" value={description} onChange={(e) => setDescription(e.target.value)} required />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Add Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
