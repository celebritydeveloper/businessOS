import { Trash2 } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { BatchExpiryTableProps } from './Catalog.types';

export function BatchExpiryTable({ batches, onWriteOffExpired }: BatchExpiryTableProps) {
  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
        No active pharmacy batches recorded in this branch yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
              <th className="py-3 px-4">Medication / Item</th>
              <th className="py-3 px-4">Batch #</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4">Remaining Qty</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((b) => {
              const days = Number(b.days_to_expiry ?? 999);
              const isExpired = days < 0;
              const isExpiringSoon = !isExpired && days <= 30;

              const badgeStyle = isExpired
                ? 'bg-red-50 text-red-700'
                : isExpiringSoon
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700';

              const statusLabel = isExpired
                ? `Expired (${Math.abs(days)}d ago)`
                : isExpiringSoon
                  ? `Expires in ${days}d`
                  : `${days}d left`;

              return (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">{b.item_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{b.batch_number}</td>
                  <td className="py-3 px-4 text-slate-700">{b.expiry_date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{b.quantity_remaining}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeStyle}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {isExpired && (
                      <Button type="button" variant="danger" onClick={() => onWriteOffExpired(b)}>
                        <Trash2 className="w-3.5 h-3.5" /> Write Off
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
