import { useState, type FormEvent } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';

export function MySecurityCard() {
  const [pwCurrent, setPwCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pinCurrentPw, setPinCurrentPw] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.', 'Password Mismatch');
      return;
    }

    setSavingPw(true);
    const res = await apiFetch('/me/security', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: pwCurrent, new_password: newPassword }),
    });
    setSavingPw(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update password.', 'Security Error');
      return;
    }

    toast.success('Login password updated successfully.', 'Password Saved');
    setPwCurrent('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPin(true);
    const res = await apiFetch('/me/security', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: pinCurrentPw, new_pos_pin: newPin }),
    });
    setSavingPin(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update POS PIN.', 'Security Error');
      return;
    }

    toast.success('4-digit POS PIN updated successfully.', 'PIN Saved');
    setPinCurrentPw('');
    setNewPin('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form 1: Change Login Password */}
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900">Change Login Password</h2>
        </div>

        <Input label="Current Password" type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required />
        <Input label="New Password (8+ characters)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

        <div className="flex justify-end pt-1">
          <Button type="submit" isLoading={savingPw}>Update Password</Button>
        </div>
      </form>

      {/* Form 2: Change 4-Digit POS PIN */}
      <form onSubmit={handlePinSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900">Change 4-Digit POS PIN</h2>
          </div>

          <p className="text-xs text-slate-500">
            Used for fast cashier switching on shared counter POS terminals.
          </p>

          <Input label="Current Login Password" type="password" value={pinCurrentPw} onChange={(e) => setPinCurrentPw(e.target.value)} required />
          <Input label="New 4-Digit POS PIN" maxLength={4} placeholder="e.g., 4820" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} required />
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" isLoading={savingPin}>Update POS PIN</Button>
        </div>
      </form>
    </div>
  );
}
