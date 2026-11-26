import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from '../ui/ToastProvider';

interface AddBranchModalProps {
  open: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onCreated: (newBranchId: string) => Promise<void>;
}

export function AddBranchModal({ open, businessId, businessName, onClose, onCreated }: AddBranchModalProps) {
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<{ branch_id: string }>('/workspace/branches', {
      method: 'POST',
      body: JSON.stringify({
        business_id: businessId,
        branch_name: branchName.trim(),
        branch_address: branchAddress.trim(),
        branch_phone: branchPhone.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not create branch.', 'Branch Limit / Error');
      return;
    }

    toast.success(`Branch "${branchName}" created!`, 'Branch Added');
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    onClose();
    await onCreated(res.body.data.branch_id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Branch</h2>
            <p className="text-xs text-slate-500">Under <strong>{businessName}</strong></p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input label="Branch Name" placeholder="e.g., Lekki Phase 1 Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
          <Input label="Street Address" placeholder="14 Admiralty Way, Lekki" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
          <Input label="Branch Phone" type="tel" placeholder="08012345678" value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Create Branch</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
