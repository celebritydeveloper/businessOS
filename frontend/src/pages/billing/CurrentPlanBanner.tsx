import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { CurrentPlanBannerProps } from './Billing.types';

export function CurrentPlanBanner({ subscription }: CurrentPlanBannerProps) {
  const isTrialing = subscription?.status === 'trialing';
  const cycle = subscription?.billing_cycle || 'monthly';
  const price = cycle === 'yearly' ? subscription?.price_yearly : subscription?.price_monthly;
  const dateRaw = isTrialing ? subscription?.trial_ends_at : subscription?.current_period_end;

  const formattedDate = dateRaw
    ? new Date(dateRaw.endsWith('Z') ? dateRaw : `${dateRaw.replace(' ', 'T')}Z`).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wide">
            {subscription?.status || 'trialing'}
          </span>
          <span className="text-xs font-semibold text-blue-100">
            {subscription?.plan_name || 'Starter'} Plan &bull; <span className="capitalize">{cycle}</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold">
          {isTrialing
            ? '24-Hour Free Trial Active'
            : price !== undefined
              ? `₦${Number(price).toLocaleString('en-NG')} / ${cycle === 'yearly' ? 'year' : 'month'}`
              : `${subscription?.plan_name || 'Starter'} Subscription`}
        </h1>

        {formattedDate && (
          <p className="text-xs text-blue-100 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {isTrialing ? `Trial ends on ${formattedDate}` : `Next billing / renewal date: ${formattedDate}`}
          </p>
        )}
      </div>

      <Link to="/billing" className="shrink-0">
        <Button variant="secondary" className="border-0 font-bold text-brand-700">
          Upgrade / Change Plan <ArrowUpRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
