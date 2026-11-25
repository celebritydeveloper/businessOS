import { Receipt } from 'lucide-react';
import type { InvoiceHistoryTableProps } from './Billing.types';

export function InvoiceHistoryTable({ invoices }: InvoiceHistoryTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-brand-600" /> Payment History &amp; Invoices
        </h2>
        <span className="text-xs text-slate-400">{invoices.length} invoice(s)</span>
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No payment transactions recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const badgeClass =
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${badgeClass}`}>
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
  );
}
