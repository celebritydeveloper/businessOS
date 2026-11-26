import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from '../ui/ToastProvider';

interface AddBusinessModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (newBusinessId: string, newBranchId: string) => Promise<void>;
}

export function AddBusinessModal({ open, onClose, onCreated }: AddBusinessModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [industryType, setIndustryType] = useState('retail');
  const [branchName, setBranchName] = useState('Main Branch');
  const [branchAddress, setBranchAddress] = useState('');
  const [regStatus, setRegStatus] = useState<'unregistered' | 'registered'>('unregistered');
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<{ business_id: string; branch_id: string }>('/workspace/businesses', {
      method: 'POST',
      body: JSON.stringify({
        business_name: businessName.trim(),
        industry_type: industryType,
        branch_name: branchName.trim(),
        branch_address: branchAddress.trim(),
        registration_status: regStatus,
        is_vat_registered: regStatus === 'registered' && isVatRegistered,
      }),
    });
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not create business.', 'Plan Limit / Error');
      return;
    }

    toast.success(`Business "${businessName}" created!`, 'New Business Ready');
    setBusinessName('');
    setBranchName('Main Branch');
    setBranchAddress('');
    onClose();
    await onCreated(res.body.data.business_id, res.body.data.branch_id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Create New Business</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input label="Business Name" placeholder="e.g., Nova Supermarket" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Industry</label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="retail">Retail Store</option>
                <option value="pharmacy">Pharmacy / Chemist</option>
                <option value="supermarket">Supermarket</option>
                <option value="restaurant">Restaurant / Eatery</option>
                <option value="laundry">Laundry &amp; Dry Cleaning</option>
                <option value="farm">Agri / Farm Store</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">CAC Registration</label>
              <select
                value={regStatus}
                onChange={(e) => setRegStatus(e.target.value as 'unregistered' | 'registered')}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="unregistered">Unregistered</option>
                <option value="registered">Registered (CAC)</option>
              </select>
            </div>
          </div>

          {regStatus === 'registered' && (
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isVatRegistered} onChange={(e) => setIsVatRegistered(e.target.checked)} />
              <span>VAT Registered (7.5% standard Nigerian VAT)</span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Initial Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
            <Input label="Branch Address (Opt.)" placeholder="Ikeja, Lagos" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Create Business</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
