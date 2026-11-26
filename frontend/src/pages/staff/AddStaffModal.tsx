import { useState, type FormEvent } from 'react';
import { Check, Copy, Mail, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { AddStaffModalProps } from './Staff.types';

export function AddStaffModal({ open, businessId, branches, roles, onClose, onCreated }: AddStaffModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState(branches.at(0)?.id || '');
  const [roleId, setRoleId] = useState(roles.at(0)?.id || '');
  const [saving, setSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setInviteUrl('');
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<{ invite_url: string }>(`/workspace/businesses/${businessId}/staff`, {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        branch_id: branchId || branches.at(0)?.id || '',
        role_id: roleId || roles.at(0)?.id || '',
        app_origin: window.location.origin,
      }),
    });
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not invite staff member.', 'Error');
      return;
    }

    toast.success(`Invitation email sent to ${email}.`, 'Invite Sent');
    setInviteUrl(res.body.data.invite_url);
    onCreated();
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Setup link copied to clipboard.', 'Copied');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Invite Team Member</h2>
          <button type="button" onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteUrl ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Invitation Emailed to {email}
              </p>
              <p>They will set their own private password and 4-digit POS PIN via their invite link (valid 24h).</p>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-slate-600">Backup Direct Setup Link</span>
              <div className="flex gap-2">
                <input readOnly value={inviteUrl} className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono" />
                <Button type="button" variant="secondary" onClick={() => void handleCopy()}>
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="button" fullWidth onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input label="Full Name" placeholder="Chidinma Okafor" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Email Address" type="email" placeholder="staff@business.ng" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Phone Number" type="tel" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Assigned Branch</label>
                <select
                  value={branchId || branches.at(0)?.id || ''}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  {branches.map((br) => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Role</label>
                <select
                  value={roleId || roles.at(0)?.id || ''}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Send Invite Link</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
