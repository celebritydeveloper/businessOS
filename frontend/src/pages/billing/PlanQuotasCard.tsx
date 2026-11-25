import { CheckCircle2, Layers } from 'lucide-react';
import type { PlanQuotasCardProps } from './Billing.types';

export function PlanQuotasCard({ limits }: PlanQuotasCardProps) {
  if (!limits) return null;

  const items = [
    {
      label: 'Businesses',
      value: limits.max_businesses >= 999 ? 'Unlimited' : `Up to ${limits.max_businesses}`,
    },
    {
      label: 'Branches',
      value: limits.max_branches >= 999 ? 'Unlimited' : `Up to ${limits.max_branches}`,
    },
    {
      label: 'Staff Accounts',
      value: limits.max_staff_users >= 999 ? 'Unlimited' : `Up to ${limits.max_staff_users}`,
    },
    {
      label: 'Catalog SKUs',
      value: limits.max_catalog_items >= 999999 ? 'Unlimited' : limits.max_catalog_items.toLocaleString(),
    },
    {
      label: 'Custom Domain White-Label',
      value: limits.custom_domain_enabled ? 'Included' : 'Enterprise Only',
    },
    {
      label: '"Powered by BusinessOS" Badge',
      value: limits.show_powered_by === false ? 'Hidden' : 'Shown',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-brand-600" />
        <h2 className="text-sm font-bold text-slate-900">Plan Limits &amp; Entitlements</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {items.map((item) => (
          <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> {item.label}
            </p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
