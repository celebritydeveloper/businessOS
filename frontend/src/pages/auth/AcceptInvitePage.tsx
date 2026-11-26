import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../core/api/httpClient';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [posPin, setPosPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiFetch<{ email: string }>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password, pos_pin: posPin }),
    });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not complete account setup.', 'Invite Error');
      return;
    }

    toast.success('Password & 4-digit POS PIN saved! Please sign in.', 'Setup Complete');
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="text-center space-y-2">
          <div className="flex justify-center"><BrandLogo /></div>
          <h1 className="text-xl font-bold text-slate-900">Set Your Password &amp; POS PIN</h1>
          <p className="text-xs text-slate-500">Complete your staff account setup to start using BusinessOS.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Create Login Password (8+ characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Create 4-Digit POS Quick-Switch PIN"
            maxLength={4}
            placeholder="e.g., 2580"
            value={posPin}
            onChange={(e) => setPosPin(e.target.value.replace(/\D/g, ''))}
            required
          />
          <Button type="submit" fullWidth isLoading={submitting} disabled={!token}>
            Activate My Staff Account
          </Button>
        </form>
      </div>
    </div>
  );
}
