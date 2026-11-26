import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { apiFetch, setAccessToken } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { toast } from '../../shared/ui/ToastProvider';
import { CashierSelectorList, type BranchCashierOption } from './CashierSelectorList';
import { ForgotPinResetForm } from './ForgotPinResetForm';
import { PinFourBoxInput } from './PinFourBoxInput';

export const POS_LOCK_STORAGE_KEY = 'bos_pos_terminal_locked';

interface SwitchCashierModalProps {
  open: boolean;
  businessId: string;
  branchId: string;
  businessName: string;
  branchName: string;
  onUnlocked: () => void;
}

export function SwitchCashierModal({
  open,
  businessId,
  branchId,
  businessName,
  branchName,
  onUnlocked,
}: SwitchCashierModalProps) {
  const navigate = useNavigate();
  const { me, refreshProfile } = useAuth();
  const [cashiers, setCashiers] = useState<BranchCashierOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<BranchCashierOption | null>(null);
  const [digits, setDigits] = useState<[string, string, string, string]>(['', '', '', '']);
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !businessId || !branchId) return;
    localStorage.setItem(POS_LOCK_STORAGE_KEY, '1');
    setSelectedUser(null);
    setResetMode(false);
    setDigits(['', '', '', '']);
    setLoading(true);

    apiFetch<{ cashiers: BranchCashierOption[] }>(
      `/workspace/businesses/${businessId}/branches/${branchId}/pos/cashiers`
    ).then((res) => {
      setLoading(false);
      if (res.ok && res.body.data) setCashiers(res.body.data.cashiers);
    });
  }, [open, businessId, branchId]);

  if (!open) return null;

  const verifyPin = async (pinCode: string) => {
    if (!selectedUser || submitting || pinCode.length !== 4) return;
    setSubmitting(true);

    const res = await apiFetch<{ access_token: string; cashier_name: string }>(
      `/workspace/businesses/${businessId}/branches/${branchId}/pos/switch-cashier`,
      {
        method: 'POST',
        body: JSON.stringify({ user_id: selectedUser.id, pos_pin: pinCode }),
      }
    );
    setSubmitting(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Incorrect 4-digit POS PIN.', 'Access Denied');
      setDigits(['', '', '', '']);
      return;
    }

    localStorage.removeItem(POS_LOCK_STORAGE_KEY);
    setAccessToken(res.body.data.access_token);
    await refreshProfile();
    toast.success(`Shift unlocked for ${res.body.data.cashier_name}.`, 'Shift Active');
    onUnlocked();
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-600 flex flex-col items-center justify-center p-4 overflow-y-auto text-white">
      <div className="w-full max-w-md space-y-7">
        {/* Top Terminal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{businessName}</h1>
          <p className="text-xs sm:text-sm text-brand-100">{branchName} &bull; Register Locked</p>
        </div>

        {/* Main Content */}
        {loading ? (
          <p className="text-xs text-brand-100 py-8 text-center">Loading branch staff accounts...</p>
        ) : !selectedUser ? (
          <CashierSelectorList
            cashiers={cashiers}
            onSelect={(c) => {
              setSelectedUser(c);
              setResetMode(false);
              setDigits(['', '', '', '']);
            }}
          />
        ) : resetMode ? (
          <div className="space-y-5 text-center">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Set / Reset POS PIN</h2>
              <p className="text-xs text-brand-100">{selectedUser.full_name}</p>
            </div>

            <ForgotPinResetForm
              businessId={businessId}
              branchId={branchId}
              userId={selectedUser.id}
              onCancel={() => setResetMode(false)}
              onUnlocked={() => {
                setResetMode(false);
                onUnlocked();
              }}
            />
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setResetMode(false);
                setDigits(['', '', '', '']);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change User
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">{selectedUser.full_name}</h2>
              <p className="text-xs text-brand-100">{selectedUser.role_name}</p>
            </div>

            {!selectedUser.has_pin ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-300/30 text-xs text-amber-100">
                  No 4-digit PIN set for this account yet.
                </div>

                {Boolean(me?.user.is_owner) && selectedUser.id === me?.user.id && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(POS_LOCK_STORAGE_KEY);
                      onUnlocked();
                      navigate('/dashboard/staff');
                    }}
                    className="w-full py-3 rounded-xl bg-white text-brand-700 text-xs font-bold hover:bg-brand-50 cursor-pointer"
                  >
                    Go to Staff &amp; PINs to Set PIN →
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-semibold text-white cursor-pointer"
                >
                  Set PIN using Account Login Password
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <PinFourBoxInput
                  digits={digits}
                  disabled={submitting}
                  onChange={setDigits}
                  onComplete={(pin) => void verifyPin(pin)}
                />

                <p className="text-xs text-brand-100">
                  {submitting ? 'Verifying PIN...' : 'Enter your 4-digit POS PIN to unlock'}
                </p>

                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="text-xs font-semibold text-white/90 hover:text-white underline cursor-pointer"
                >
                  Forgot PIN? Reset with Login Password
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
