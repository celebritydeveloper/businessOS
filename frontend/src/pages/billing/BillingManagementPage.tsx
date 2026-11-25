import { useEffect, useState } from 'react';
import { apiFetch } from '../../core/api/httpClient';
import { toast } from '../../shared/ui/ToastProvider';
import type { BillingOverviewResponse } from './Billing.types';
import { CurrentPlanBanner } from './CurrentPlanBanner';
import { InvoiceHistoryTable } from './InvoiceHistoryTable';
import { PaymentMethodCard } from './PaymentMethodCard';
import { PlanQuotasCard } from './PlanQuotasCard';

export function BillingManagementPage() {
  const [data, setData] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch<BillingOverviewResponse>('/billing/overview');
      if (res.ok && res.body.data) {
        setData(res.body.data);
      } else {
        toast.error(res.body.message || 'Unable to load billing overview.', 'Error');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading billing &amp; invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <CurrentPlanBanner subscription={data?.subscription || null} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodCard paymentMethod={data?.payment_method || null} />
        <PlanQuotasCard limits={data?.subscription?.limits} />
      </div>

      <InvoiceHistoryTable invoices={data?.invoices || []} />
    </div>
  );
}
