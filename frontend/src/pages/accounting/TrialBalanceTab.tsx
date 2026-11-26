import type { TrialBalanceAccount } from './Accounting.types';

interface TrialBalanceTabProps {
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
}

export function TrialBalanceTab({ accounts, totalDebits, totalCredits }: TrialBalanceTabProps) {
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">Chart of Accounts Trial Balance</span>
        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {isBalanced ? 'Balanced (Dr = Cr)' : 'Out of Balance'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Account Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Debit (₦)</th>
              <th className="py-3 px-4 text-right">Credit (₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <tr key={acc.code} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-slate-700">{acc.code}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                <td className="py-3 px-4 capitalize text-slate-500">{acc.account_type}</td>
                <td className="py-3 px-4 text-right font-mono">{acc.total_debit > 0 ? fmt(acc.total_debit) : '—'}</td>
                <td className="py-3 px-4 text-right font-mono">{acc.total_credit > 0 ? fmt(acc.total_credit) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
              <td colSpan={3} className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right font-mono">{fmt(totalDebits)}</td>
              <td className="py-3 px-4 text-right font-mono">{fmt(totalCredits)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
