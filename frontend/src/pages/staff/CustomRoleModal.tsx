import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import { AVAILABLE_PERMISSIONS, type CustomRoleModalProps } from './Staff.types';

export function CustomRoleModal({ open, businessId, onClose, onCreated }: CustomRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['pos.sell', 'sales.view']);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedPerms.length === 0) return;

    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/roles`, {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        permissions: selectedPerms,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not create custom role.', 'Error');
      return;
    }

    toast.success(`Role "${name}" created.`, 'Role Saved');
    setName('');
    setDescription('');
    setSelectedPerms(['pos.sell', 'sales.view']);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Create Custom Role</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input label="Role Name" placeholder="e.g., Shift Supervisor" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description (Optional)" placeholder="Short summary of duties" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">Granted Permissions</span>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.key} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                    className="rounded border-slate-300 text-brand-600"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving} disabled={selectedPerms.length === 0}>Create Role</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
