import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { toast } from '../../shared/ui/ToastProvider';
import type { VerifyPaymentResponse } from './Billing.types';

export function BillingCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [statusText, setStatusText] = useState('Verifying your payment with gateway...');

  useEffect(() => {
    const reference = params.get('reference') || params.get('tx_ref') || '';
    if (!reference) {
      toast.error('Missing payment reference.', 'Verification Error');
      navigate('/dashboard/billing', { replace: true });
      return;
    }

    void (async () => {
      const res = await apiFetch<VerifyPaymentResponse>(
        `/billing/verify?reference=${encodeURIComponent(reference)}`
      );
      if (res.ok && res.body.data?.verified) {
        await refreshProfile();
        toast.success('Subscription activated! All features unlocked.', 'Payment Confirmed');
        navigate('/dashboard', { replace: true });
      } else {
        setStatusText(res.body.message || 'Payment verification pending.');
        toast.error(res.body.message || 'Could not confirm payment yet.', 'Unverified');
        setTimeout(() => navigate('/dashboard/billing', { replace: true }), 2000);
      }
    })();
  }, [navigate, params, refreshProfile]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
      <BrandLogo size="lg" />
      <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-700">{statusText}</p>
    </div>
  );
}
