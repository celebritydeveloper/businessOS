import type { ProfitAndLossSummary } from './Accounting.types';

interface ProfitAndLossTabProps {
  pnl: ProfitAndLossSummary;
}

export function ProfitAndLossTab({ pnl }: ProfitAndLossTabProps) {
  const marginPct = pnl.revenue > 0 ? ((pnl.gross_profit / pnl.revenue) * 100).toFixed(1) : '0.0';
  const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Net Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(pnl.revenue)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Gross Profit ({marginPct}% Margin)</p>
          <p className="text-xl font-bold text-brand-600 mt-1">{fmt(pnl.gross_profit)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Net Operating Profit</p>
          <p className={`text-xl font-bold mt-1 ${pnl.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmt(pnl.net_profit)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs divide-y divide-slate-100 text-xs">
        <div className="py-3 flex justify-between">
          <span className="font-semibold text-slate-700">4000 — Sales &amp; Service Revenue (Net of VAT)</span>
          <span className="font-bold text-slate-900">{fmt(pnl.revenue)}</span>
        </div>
        <div className="py-3 flex justify-between">
          <span className="font-semibold text-slate-700">5000 — Cost of Goods Sold (COGS)</span>
          <span className="font-semibold text-red-600">- {fmt(pnl.cogs)}</span>
        </div>
        <div className="py-3 flex justify-between bg-slate-50/70 px-3 rounded-lg">
          <span className="font-bold text-slate-900">Gross Profit</span>
          <span className="font-bold text-brand-600">{fmt(pnl.gross_profit)}</span>
        </div>
        <div className="py-3 flex justify-between">
          <span className="font-semibold text-slate-700">Operating Expenses (6000–6999)</span>
          <span className="font-semibold text-red-600">- {fmt(pnl.expenses)}</span>
        </div>
        <div className="py-3.5 flex justify-between text-sm">
          <span className="font-bold text-slate-900">Net Profit / (Loss)</span>
          <span className={`font-bold ${pnl.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmt(pnl.net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
}
