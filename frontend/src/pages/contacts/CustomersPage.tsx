import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Banknote, Pencil, Plus, Search, Users } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import type { CustomerItem } from './Contacts.types';
import { CustomerRepaymentModal } from './CustomerRepaymentModal';
import { EditCustomerModal } from './EditCustomerModal';

export function CustomersPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<CustomerItem | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    const res = await apiFetch<{ customers: CustomerItem[] }>(
      `/workspace/businesses/${activeBusiness.id}/customers${q}`
    );
    if (res.ok && res.body.data) setCustomers(res.body.data.customers);
    setLoading(false);
  }, [activeBusiness?.id, search]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  if (!activeBusiness) return null;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/customers`, {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        credit_limit: parseFloat(creditLimit) || 0,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not save customer.', 'Error');
      return;
    }

    toast.success(`Customer "${fullName}" added.`, 'Saved');
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCreditLimit('');
    void loadCustomers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Customers &amp; Credit Book</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track repeat buyers, credit limits, and unpaid balances for <strong>{activeBusiness.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs sm:text-sm focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-1">
              <Users className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No customers found</p>
              <p>Add regular buyers or credit customers using the form on the right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                    <th className="py-3 px-4 text-right">Credit Owed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const owed = Number(c.credit_balance || 0);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{c.full_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {c.phone || 'No phone'}{c.email ? ` • ${c.email}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          ₦{Number(c.total_spent || 0).toLocaleString('en-NG')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={owed > 0 ? 'text-rose-600' : 'text-slate-400'}>
                            ₦{owed.toLocaleString('en-NG')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <Button type="button" variant="secondary" onClick={() => setEditingCustomer(c)}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          {owed > 0 && (
                            <Button type="button" onClick={() => setPayingCustomer(c)}>
                              <Banknote className="w-3.5 h-3.5" /> Pay Debt
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
            <Plus className="w-4 h-4 text-brand-600" /> Add New Customer
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Full Name / Company</label>
              <input type="text" placeholder="e.g., Mama Chinedu Stores" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input type="text" placeholder="0803..." value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email (For Invoices &amp; Project Updates)</label>
              <input type="email" placeholder="client@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Address (Optional)</label>
              <input type="text" placeholder="Biogbolo / Yenagoa" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Credit Limit (₦)</label>
              <input type="number" step="0.01" placeholder="50000" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <Button type="submit" className="w-full" isLoading={saving}>Save Customer</Button>
          </form>
        </div>
      </div>

      <EditCustomerModal
        key={editingCustomer?.id || 'edit-none'}
        customer={editingCustomer}
        businessId={activeBusiness.id}
        onClose={() => setEditingCustomer(null)}
        onSaved={() => void loadCustomers()}
      />

      <CustomerRepaymentModal
        key={payingCustomer?.id || 'pay-none'}
        customer={payingCustomer}
        businessId={activeBusiness.id}
        branchId={activeBranch?.id || ''}
        onClose={() => setPayingCustomer(null)}
        onRecorded={() => void loadCustomers()}
      />
    </div>
  );
}
