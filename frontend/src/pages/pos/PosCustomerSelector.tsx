import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { CustomerItem } from '../contacts/Contacts.types';

interface PosCustomerSelectorProps {
  businessId: string;
  selectedCustomer: CustomerItem | null;
  customerName: string;
  customerPhone: string;
  onSelectCustomer: (cust: CustomerItem | null) => void;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
}

export function PosCustomerSelector({
  businessId,
  selectedCustomer,
  customerName,
  customerPhone,
  onSelectCustomer,
  onNameChange,
  onPhoneChange,
}: PosCustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [quickAdding, setQuickAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    apiFetch<{ customers: CustomerItem[] }>(`/workspace/businesses/${businessId}/customers`).then((res) => {
      if (res.ok && res.body.data) setCustomers(res.body.data.customers);
    });
  }, [businessId]);

  const handleQuickCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await apiFetch<{ customer_id: string }>(`/workspace/businesses/${businessId}/customers`, {
      method: 'POST',
      body: JSON.stringify({ full_name: newName.trim(), phone: newPhone.trim(), credit_limit: 0 }),
    });
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not add customer.', 'Error');
      return;
    }

    const created: CustomerItem = {
      id: res.body.data.customer_id,
      full_name: newName.trim(),
      phone: newPhone.trim() || null,
      email: null,
      address: null,
      credit_limit: 0,
      credit_balance: 0,
      total_spent: 0,
      notes: null,
    };
    setCustomers((prev) => [created, ...prev]);
    onSelectCustomer(created);
    setQuickAdding(false);
    setNewName('');
    setNewPhone('');
    toast.success(`Customer "${created.full_name}" added & selected.`, 'Customer Saved');
  };

  return (
    <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">Customer (Optional / For Credit)</label>
        <button
          type="button"
          onClick={() => setQuickAdding((p) => !p)}
          className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" /> {quickAdding ? 'Cancel' : 'Quick Add'}
        </button>
      </div>

      {quickAdding ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Name" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input label="Phone" placeholder="080..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <Button type="button" onClick={handleQuickCreate} isLoading={saving} disabled={!newName.trim()}>
            Save &amp; Select
          </Button>
        </div>
      ) : (
        <>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const found = customers.find((c) => c.id === e.target.value) || null;
              onSelectCustomer(found);
              onNameChange(found?.full_name || '');
              onPhoneChange(found?.phone || '');
            }}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm"
          >
            <option value="">Walk-in Customer (One-off)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.phone ? `(${c.phone})` : ''} — Owed: ₦{Number(c.credit_balance || 0).toLocaleString('en-NG')}
              </option>
            ))}
          </select>

          {!selectedCustomer && (
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="Walk-in Name (Opt.)" placeholder="Buyer name" value={customerName} onChange={(e) => onNameChange(e.target.value)} />
              <Input label="Phone (Opt.)" placeholder="080..." value={customerPhone} onChange={(e) => onPhoneChange(e.target.value)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
