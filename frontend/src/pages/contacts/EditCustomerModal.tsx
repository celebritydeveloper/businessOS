import { useState, type FormEvent } from 'react';
import { Pencil, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { CustomerItem } from './Contacts.types';

interface EditCustomerModalProps {
  customer: CustomerItem | null;
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditCustomerModal({ customer, businessId, onClose, onSaved }: EditCustomerModalProps) {
  const [fullName, setFullName] = useState(customer?.full_name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [creditLimit, setCreditLimit] = useState(customer ? String(customer.credit_limit || 0) : '0');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/customers/${customer.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        credit_limit: parseFloat(creditLimit) || 0,
        notes: notes.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update customer.', 'Error');
      return;
    }

    toast.success('Customer details updated.', 'Saved');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Pencil className="w-4 h-4 text-brand-600" /> Edit Customer
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name / Company" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Email (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Credit Limit (₦)" type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          <Input label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
