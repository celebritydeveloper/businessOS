import { useEffect, useState, type FormEvent } from 'react';
import { FolderPlus, UserPlus, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { CustomerItem } from '../contacts/Contacts.types';
import type { ProjectType } from './Creative.types';
import { useNavigate } from 'react-router-dom';

interface CreateProjectModalProps {
  open: boolean;
  businessId: string;
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateProjectModal({ open, businessId, branchId, onClose, onCreated }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('fixed_project');
  const [contractAmount, setContractAmount] = useState('');
  const [revisionsIncluded, setRevisionsIncluded] = useState('3');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !businessId) return;
    setLoadingCustomers(true);
    apiFetch<{ customers: CustomerItem[] }>(`/workspace/businesses/${businessId}/customers`).then((res) => {
      if (res.ok && res.body.data) setCustomers(res.body.data.customers);
      setLoadingCustomers(false);
    });
  }, [open, businessId]);

  if (!open) return null;

  const handleGoToContacts = () => {
    onClose();
    navigate('/dashboard/customers');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/branches/${branchId}/projects`, {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        title: title.trim(),
        project_type: projectType,
        contract_amount: parseFloat(contractAmount) || 0,
        revisions_included: parseInt(revisionsIncluded, 10) || 3,
        due_date: dueDate,
        notes: notes.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not create project.', 'Error');
      return;
    }

    toast.success('Creative project created!', 'Saved');
    setTitle('');
    setContractAmount('');
    setNotes('');
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-brand-600" /> New Client Project
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Project Title</label>
             <Input label="Title" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Client (From Contacts)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm">
                <option value="">-- Select Client (Opt.) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              {!loadingCustomers && customers.length === 0 ? (
                <button
                  type="button"
                  onClick={handleGoToContacts}
                  className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> No contacts yet — Add Contact
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoToContacts}
                  className="text-[11px] font-medium text-slate-500 hover:text-brand-600 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" /> Add new contact in Contacts
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Billing Model</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm">
                <option value="fixed_project">Fixed Project Quote</option>
                <option value="monthly_retainer">Monthly Retainer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Quote / Fee (₦)" type="number" step="0.01" placeholder="250000" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} required />
            <Input label="Included Revisions" type="number" min="0" value={revisionsIncluded} onChange={(e) => setRevisionsIncluded(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <Input label="Scope Notes (Optional)" placeholder="Key deliverables or client brief notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Create Project</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
