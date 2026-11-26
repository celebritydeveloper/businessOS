import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Receipt } from 'lucide-react';
import type { DashboardKpis, RecentSaleSummary } from './Dashboard.types';

interface DashboardAlertsCardProps {
  kpis: DashboardKpis;
  supportsBatchExpiry: boolean;
  recentSales: RecentSaleSummary[];
}

export function DashboardAlertsCard({ kpis, supportsBatchExpiry, recentSales }: DashboardAlertsCardProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Stock &amp; Expiry Alerts</h2>

        <Link
          to="/dashboard/catalog"
          className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200 hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Low-Stock Products</p>
              <p className="text-amber-800">At or below reorder threshold</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-bold">
            {kpis.low_stock_count}
          </span>
        </Link>

        {supportsBatchExpiry && (
          <Link
            to="/dashboard/batches"
            className="flex items-center justify-between p-3 rounded-xl bg-red-50/80 border border-red-200 hover:bg-red-100/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-950">Expiring Within 60 Days</p>
                <p className="text-red-800">Review FEFO batches</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-red-200 text-red-950 text-xs font-bold">
              {kpis.expiring_count}
            </span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-brand-600" /> Recent Branch Receipts
          </h2>
          <Link to="/dashboard/sales" className="text-xs font-semibold text-brand-600 hover:underline">
            View All
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No sales recorded on this branch yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentSales.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-slate-800">{s.receipt_number}</p>
                  <p className="text-[11px] text-slate-500">{s.customer_name || 'Walk-in'} • {s.cashier_name || 'Staff'}</p>
                </div>
                <span className="font-bold text-slate-900">₦{Number(s.grand_total).toLocaleString('en-NG')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
