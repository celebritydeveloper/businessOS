import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { CreativeProjectItem } from './Creative.types';

export type ProjectModalMode = 'deliverable' | 'time_log' | 'expense' | 'revision' | 'payment' | 'renew_retainer';

interface ProjectActionModalProps {
  project: CreativeProjectItem | null;
  mode: ProjectModalMode;
  businessId: string;
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectActionModal({ project, mode, businessId, branchId, onClose, onSaved }: ProjectActionModalProps) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [amount, setAmount] = useState(
    project && mode === 'renew_retainer' ? String(project.contract_amount) : ''
  );
  const [method, setMethod] = useState<'transfer' | 'cash' | 'credit'>('transfer');
  const [cycleLabel, setCycleLabel] = useState(
    new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  );
  const [saving, setSaving] = useState(false);

  if (!project) return null;

  const isBilling = mode === 'payment' || mode === 'renew_retainer';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const url = isBilling
      ? `/workspace/businesses/${businessId}/branches/${branchId}/projects/${project.id}/bill`
      : `/workspace/businesses/${businessId}/branches/${branchId}/projects/${project.id}/logs`;

    const payload = isBilling
      ? { action: mode, amount: parseFloat(amount) || 0, method, cycle_label: cycleLabel.trim() || title.trim() }
      : { log_type: mode, title: title.trim(), hours_spent: parseFloat(hours) || 0, cost_amount: parseFloat(amount) || 0 };

    const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not save entry.', 'Error');
      return;
    }

    toast.success('Project updated!', 'Saved');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 capitalize">
            {mode.replace('_', ' ')} — {project.title}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isBilling && (
            <Input
              label="Description"
              placeholder={mode === 'time_log' ? 'e.g., Homepage design & prototype' : mode === 'expense' ? 'e.g., Freelance voiceover / printing' : 'e.g., Logo concept v1'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          )}

          {mode === 'time_log' && (
            <Input label="Hours Spent" type="number" step="0.25" min="0.25" placeholder="2.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
          )}

          {(mode === 'expense' || mode === 'payment') && (
            <Input label="Amount (₦)" type="number" step="0.01" min="1" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          )}

          {isBilling && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Payment / Billing Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as 'transfer' | 'cash' | 'credit')} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm">
                  <option value="transfer">Bank Transfer (1010)</option>
                  <option value="cash">Cash (1000)</option>
                  <option value="credit">Invoice on Client Credit (1100)</option>
                </select>
              </div>
              <Input
                label={mode === 'renew_retainer' ? 'Retainer Month Label' : 'Milestone Note'}
                value={cycleLabel}
                onChange={(e) => setCycleLabel(e.target.value)}
              />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
