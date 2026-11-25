import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CreditCard, Receipt } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import type { BillingOverviewResponse } from './Billing.types';

export function BillingManagementPage() {
  const [data, setData] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch<BillingOverviewResponse>('/billing/overview');
      if (res.ok && res.body.data) {
        setData(res.body.data);
      } else {
        toast.error(res.body.message || 'Unable to load billing details.', 'Error');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading billing &amp; invoices...</div>;
  }

  const sub = data?.subscription;
  const card = data?.payment_method;
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-6">
      {/* Upgrade Banner + Current Plan Card */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold uppercase tracking-wide">
            {sub?.status || 'trialing'} &bull; {sub?.plan_name || 'Starter'} Plan
          </span>
          <h1 className="text-xl font-bold mt-2">
            {sub?.status === 'trialing'
              ? 'You are currently on your 24-hour free trial'
              : `Active ${sub?.plan_name || 'Starter'} (${sub?.billing_cycle || 'monthly'}) Subscription`}
          </h1>
          <p className="text-xs text-blue-100 mt-1">
            Upgrade anytime to unlock more branches, higher catalog limits, and custom domain white-labeling.
          </p>
        </div>

        <Link to="/billing" className="shrink-0">
          <Button variant="secondary" className="border-0 font-bold text-brand-700">
            Upgrade / Change Plan <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Saved Payment Method */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Payment Method</p>
            {card ? (
              <p className="text-xs text-slate-600 mt-0.5">
                {card.brand} ending in <strong>•••• {card.last4}</strong>
                {card.exp_month && card.exp_year ? ` (Exp ${card.exp_month}/${card.exp_year})` : ''} via{' '}
                <span className="capitalize font-medium">{card.gateway}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                No payment card recorded yet. Complete a checkout via Paystack or Flutterwave to activate billing.
              </p>
            )}
          </div>
        </div>

        <Link to="/billing" className="text-xs font-semibold text-brand-600 hover:underline">
          Update Payment Method
        </Link>
      </div>

      {/* Invoices & Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" /> Payment History &amp; Invoices
          </h2>
          <span className="text-xs text-slate-400">{invoices.length} record(s)</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No payment invoices recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const badgeStyle =
                    inv.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : inv.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-800';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{inv.reference}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(inv.created_at).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">{inv.gateway}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₦{inv.amount.toLocaleString('en-NG')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${badgeStyle}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
