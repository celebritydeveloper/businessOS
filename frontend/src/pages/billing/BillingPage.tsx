import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { SubscriptionPlan } from '../../core/types';
import { toast } from '../../shared/ui/ToastProvider';
import type {
  BillingCycle,
  InitializeCheckoutPayload,
  InitializeCheckoutResponse,
  PaymentGateway,
  PlansApiResponse,
} from './Billing.types';
import { PlanCard } from './PlanCard';

export function BillingPage() {
  const { me, subscriptionRequired } = useAuth();
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
    <div className="space-y-6">
      {subscriptionRequired && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
          Your 24-hour free trial has ended. Select a plan below to restore full workspace access immediately.
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Billing &amp; Subscription</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Current Status:{' '}
            <strong className="uppercase text-brand-600">{me?.subscription?.status || 'trialing'}</strong>
            {me?.subscription?.plan_slug ? ` (${me.subscription.plan_slug})` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                cycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                cycle === 'yearly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Yearly (Save 2 Months)
            </button>
          </div>

          {/* Gateway Selector */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              type="button"
              onClick={() => setGateway('paystack')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                gateway === 'paystack' ? 'bg-brand-600 text-white' : 'text-slate-600'
              }`}
            >
              Paystack
            </button>
            <button
              type="button"
              onClick={() => setGateway('flutterwave')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                gateway === 'flutterwave' ? 'bg-brand-600 text-white' : 'text-slate-600'
              }`}
            >
              Flutterwave
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading subscription tiers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
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
        Secured Naira (₦) payments via Paystack &amp; Flutterwave with instant subscription activation.
      </p>
    </div>
  );
}
