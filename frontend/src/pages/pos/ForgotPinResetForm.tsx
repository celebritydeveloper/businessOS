import { useState, type FormEvent } from 'react';
import { apiFetch, setAccessToken } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { toast } from '../../shared/ui/ToastProvider';
import { POS_LOCK_STORAGE_KEY } from './SwitchCashierModal';

interface ForgotPinResetFormProps {
  businessId: string;
  branchId: string;
  userId: string;
  onCancel: () => void;
  onUnlocked: () => void;
}

export function ForgotPinResetForm({
  businessId,
  branchId,
  userId,
  onCancel,
  onUnlocked,
}: ForgotPinResetFormProps) {
  const { refreshProfile } = useAuth();
  const [loginPassword, setLoginPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<{ access_token: string; cashier_name: string }>(
      `/workspace/businesses/${businessId}/branches/${branchId}/pos/reset-pin`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          login_password: loginPassword,
          new_pos_pin: newPin,
        }),
      }
    );
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not reset POS PIN.', 'Verification Failed');
      return;
    }

    localStorage.removeItem(POS_LOCK_STORAGE_KEY);
    setAccessToken(res.body.data.access_token);
    await refreshProfile();
    toast.success(`New PIN saved & shift unlocked for ${res.body.data.cashier_name}.`, 'PIN Reset');
    onUnlocked();
  };

  return (
    <form onSubmit={handleReset} className="space-y-3 text-left">
      <div>
        <label className="block text-[11px] font-semibold text-brand-100 mb-1">Account Login Password</label>
        <input
          type="password"
          required
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder="Enter account password"
          className="w-full h-11 px-3.5 rounded-xl bg-white/15 border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-brand-100 mb-1">New 4-Digit POS PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          required
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full h-11 px-3.5 rounded-xl bg-white/15 border border-white/30 text-white placeholder-white/50 text-sm tracking-widest focus:outline-none focus:border-white"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onCancel} className="text-xs text-brand-100 hover:text-white cursor-pointer">
          ← Back to PIN
        </button>
        <button
          type="submit"
          disabled={saving || newPin.length !== 4}
          className="px-4 py-2.5 rounded-xl bg-white text-brand-700 text-xs font-bold hover:bg-brand-50 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Resetting...' : 'Reset PIN & Unlock'}
        </button>
      </div>
    </form>
  );
}
