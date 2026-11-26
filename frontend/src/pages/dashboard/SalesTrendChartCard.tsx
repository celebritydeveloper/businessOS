import type { DailyTrendPoint, PaymentMixItem } from './Dashboard.types';

interface SalesTrendChartCardProps {
  trend: DailyTrendPoint[];
  paymentMix: PaymentMixItem[];
}

export function SalesTrendChartCard({ trend, paymentMix }: SalesTrendChartCardProps) {
  const maxRev = Math.max(...trend.map((d) => d.revenue), 1);
  const totalPay = paymentMix.reduce((sum, p) => sum + Number(p.total || 0), 0);

  const labelForMethod = (m: string) => {
    if (m === 'pos_card') return 'POS Card';
    if (m === 'transfer') return 'Bank Transfer';
    return 'Cash';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">7-Day Branch Revenue Trend</h2>
          <p className="text-xs text-slate-500">Daily sales performance across the last 7 days</p>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="h-44 flex items-end gap-3 pt-4 border-b border-slate-100 pb-3">
        {trend.map((day) => {
          const heightPct = Math.max(6, Math.round((day.revenue / maxRev) * 100));
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-semibold text-slate-500">
                {day.revenue > 0 ? `₦${Math.round(day.revenue / 1000)}k` : '₦0'}
              </span>
              <div
                title={`${day.date}: ₦${day.revenue.toLocaleString('en-NG')} (${day.orders} sales)`}
                style={{ height: `${day.revenue > 0 ? heightPct : 6}%` }}
                className={`w-full max-w-[38px] rounded-t-lg transition-all ${
                  day.revenue > 0 ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-100'
                }`}
              />
              <span className="text-[11px] font-bold text-slate-700">{day.label}</span>
            </div>
          );
        })}
      </div>

      {/* Month-to-Date Payment Channel Mix */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-700">Month-to-Date Payment Mix</p>
        {paymentMix.length === 0 ? (
          <p className="text-xs text-slate-400">No payments recorded yet this month.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {paymentMix.map((p) => {
              const amt = Number(p.total || 0);
              const pct = totalPay > 0 ? Math.round((amt / totalPay) * 100) : 0;
              return (
                <div key={p.method} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between text-slate-600">
                    <span>{labelForMethod(p.method)}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">₦{amt.toLocaleString('en-NG')}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
