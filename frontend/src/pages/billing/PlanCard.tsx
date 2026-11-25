import { Check, Sparkles } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { PlanCardProps } from './Billing.types';

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

export function PlanCard({
  plan,
  cycle,
  currentSubscription,
  processingSlug,
  onSelectPlan,
}: PlanCardProps) {
  const isPopular = plan.slug === 'growth';
  const price = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const isCurrentActive =
    currentSubscription?.status === 'active' &&
    currentSubscription?.plan_slug === plan.slug &&
    (currentSubscription?.billing_cycle || 'monthly') === cycle;

  const features: string[] = [
    plan.limits.max_businesses >= 999 ? 'Unlimited Businesses' : `Up to ${plan.limits.max_businesses} Business${plan.limits.max_businesses > 1 ? 'es' : ''}`,
    plan.limits.max_branches >= 999 ? 'Unlimited Branches' : `Up to ${plan.limits.max_branches} Branch${plan.limits.max_branches > 1 ? 'es' : ''}`,
    plan.limits.max_staff_users >= 999 ? 'Unlimited Staff Accounts' : `Up to ${plan.limits.max_staff_users} Staff Users`,
    plan.limits.max_catalog_items >= 999999 ? 'Unlimited Catalog Items' : `Up to ${plan.limits.max_catalog_items.toLocaleString()} Catalog Items`,
    plan.limits.offline_sync_enabled ? 'Offline POS & Clash-Free Sync' : 'Online POS Terminal',
    plan.limits.batch_expiry_tracking ? 'Pharmacy Batch & FEFO Expiry Tracking' : 'Standard Inventory Tracking',
    plan.limits.custom_domain_enabled ? 'Custom Domain & White-Label App' : 'Receipt Branding (Shows Powered by BusinessOS)',
  ];

  return (
    <div
      className={`relative bg-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
        isPopular
          ? 'border-2 border-brand-600 shadow-lg ring-4 ring-brand-600/10'
          : 'border border-slate-200 shadow-xs'
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-bold shadow-xs">
          <Sparkles className="w-3 h-3" /> Most Popular
        </span>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
          {isCurrentActive && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
              Current Plan
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>

        <div className="my-5 pb-5 border-b border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{formatNaira(price)}</span>
            <span className="text-xs font-medium text-slate-500">/{cycle === 'yearly' ? 'year' : 'month'}</span>
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
          {features.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        variant={isPopular ? 'primary' : 'secondary'}
        fullWidth
        disabled={isCurrentActive || processingSlug !== null}
        isLoading={processingSlug === plan.slug}
        onClick={() => onSelectPlan(plan.slug)}
      >
        {isCurrentActive ? 'Active Plan' : `Choose ${plan.name}`}
      </Button>
    </div>
  );
}
