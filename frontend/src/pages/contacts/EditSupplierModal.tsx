import { useState, type FormEvent } from 'react';
import { Pencil, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { SupplierItem } from './Contacts.types';

interface EditSupplierModalProps {
  supplier: SupplierItem | null;
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSupplierModal({ supplier, businessId, onClose, onSaved }: EditSupplierModalProps) {
  const [name, setName] = useState(supplier?.name || '');
  const [contactPerson, setContactPerson] = useState(supplier?.contact_person || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [bankDetails, setBankDetails] = useState(supplier?.bank_details || '');
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!supplier) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/suppliers/${supplier.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: name.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        bank_details: bankDetails.trim(),
        notes: notes.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update supplier.', 'Error');
      return;
    }

    toast.success('Supplier details updated.', 'Saved');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Pencil className="w-4 h-4 text-brand-600" /> Edit Supplier
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Supplier / Company Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Bank Details" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} />
          </div>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
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
