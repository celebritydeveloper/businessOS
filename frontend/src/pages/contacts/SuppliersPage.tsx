import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Banknote, FilePlus2, Pencil, Plus, Search, Truck } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { SupplierItem } from './Contacts.types';
import { EditSupplierModal } from './EditSupplierModal';
import { SupplierTxModal } from './SupplierTxModal';

export function SuppliersPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [activeSupplier, setActiveSupplier] = useState<SupplierItem | null>(null);
  const [txType, setTxType] = useState<'supplier_bill' | 'supplier_payment'>('supplier_payment');

  const loadSuppliers = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    const res = await apiFetch<{ suppliers: SupplierItem[] }>(
      `/workspace/businesses/${activeBusiness.id}/suppliers${q}`
    );
    if (res.ok && res.body.data) setSuppliers(res.body.data.suppliers);
    setLoading(false);
  }, [activeBusiness?.id, search]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  if (!activeBusiness) return null;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/suppliers`, {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        bank_details: bankDetails.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not save supplier.', 'Error');
      return;
    }

    toast.success(`Supplier "${name}" added.`, 'Saved');
    setName('');
    setContactPerson('');
    setPhone('');
    setBankDetails('');
    void loadSuppliers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Suppliers &amp; Accounts Payable</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage wholesalers, feed/drug vendors, credit bills, and payouts for <strong>{activeBusiness.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplier by company, contact person, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs sm:text-sm focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-1">
              <Truck className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No suppliers added yet</p>
              <p>Add your distributors, hatcheries, or wholesalers on the right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Bank Details</th>
                    <th className="py-3 px-4 text-right">Balance Owed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => {
                    const owed = Number(s.payable_balance || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {s.contact_person ? `${s.contact_person} • ` : ''}{s.phone || 'No phone'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{s.bank_details || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={owed > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            ₦{owed.toLocaleString('en-NG')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <Button type="button" variant="secondary" onClick={() => setEditingSupplier(s)}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setActiveSupplier(s);
                              setTxType('supplier_bill');
                            }}
                          >
                            <FilePlus2 className="w-3.5 h-3.5" /> Bill
                          </Button>
                          {owed > 0 && (
                            <Button
                              type="button"
                              onClick={() => {
                                setActiveSupplier(s);
                                setTxType('supplier_payment');
                              }}
                            >
                              <Banknote className="w-3.5 h-3.5" /> Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 h-fit">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-brand-600" /> Add New Supplier
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Supplier / Company Name" placeholder="e.g., TopFeeds Agro Depot" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Contact Person" placeholder="e.g., Mr. Emeka" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            <Input label="Phone Number" placeholder="0802..." value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Bank Account Details" placeholder="GTBank 0123456789" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} />
            <Button type="submit" className="w-full" isLoading={saving}>Save Supplier</Button>
          </form>
        </div>
      </div>

      <EditSupplierModal
        key={editingSupplier?.id || 'edit-supp-none'}
        supplier={editingSupplier}
        businessId={activeBusiness.id}
        onClose={() => setEditingSupplier(null)}
        onSaved={() => void loadSuppliers()}
      />

      <SupplierTxModal
        key={`${activeSupplier?.id || 'none'}-${txType}`}
        supplier={activeSupplier}
        txType={txType}
        businessId={activeBusiness.id}
        branchId={activeBranch?.id || ''}
        onClose={() => setActiveSupplier(null)}
        onSaved={() => void loadSuppliers()}
      />
    </div>
  );
}
