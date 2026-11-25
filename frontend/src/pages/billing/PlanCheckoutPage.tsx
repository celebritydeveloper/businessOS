import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, LogOut, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { SubscriptionPlan } from '../../core/types';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { toast } from '../../shared/ui/ToastProvider';
import type {
  BillingCycle,
  InitializeCheckoutPayload,
  InitializeCheckoutResponse,
  PaymentGateway,
  PlansApiResponse,
} from './Billing.types';
import { PlanCard } from './PlanCard';

export function PlanCheckoutPage() {
  const { me, isAccessBlocked, logout } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [gateway, setGateway] = useState<PaymentGateway>('paystack');
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch<PlansApiResponse>('/plans');
      if (res.ok && res.body.data?.plans) {
        setPlans(res.body.data.plans);
      } else {
        toast.error(res.body.message || 'Could not load subscription plans.', 'Error');
      }
      setLoading(false);
    })();
  }, []);

  const handleSelectPlan = async (planSlug: string) => {
    setProcessingSlug(planSlug);
    const payload: InitializeCheckoutPayload = {
      plan_slug: planSlug,
      billing_cycle: cycle,
      gateway,
      callback_url: `${window.location.origin}/billing/callback`,
    };

    const res = await apiFetch<InitializeCheckoutResponse>('/billing/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setProcessingSlug(null);

    if (!res.ok || !res.body.data?.authorization_url) {
      toast.error(res.body.message || 'Unable to start payment checkout.', 'Checkout Failed');
      return;
    }

    window.location.href = res.body.data.authorization_url;
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Standalone Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-4">
          {!isAccessBlocked && (
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {isAccessBlocked && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center text-xs sm:text-sm text-red-900 font-medium">
            Your 24-hour free trial has ended. Choose a subscription plan below to unlock your workspace immediately.
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Choose the right plan for your business</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Scale across branches, track pharmacy batches &amp; expiry, and sync offline sales seamlessly.
          </p>

          {/* Cycle & Gateway Controls */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  cycle === 'monthly' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle('yearly')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  cycle === 'yearly' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                Yearly (Save 2 Months)
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <button
                type="button"
                onClick={() => setGateway('paystack')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  gateway === 'paystack' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Paystack
              </button>
              <button
                type="button"
                onClick={() => setGateway('flutterwave')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  gateway === 'flutterwave' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Flutterwave
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                currentSubscription={me?.subscription || null}
                processingSlug={processingSlug}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Secured Naira (₦) payments via Paystack &amp; Flutterwave.
        </p>
      </main>
    </div>
  );
}
