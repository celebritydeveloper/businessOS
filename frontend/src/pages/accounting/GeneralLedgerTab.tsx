import type { JournalEntryItem } from './Accounting.types';

interface GeneralLedgerTabProps {
  entries: JournalEntryItem[];
}

export function GeneralLedgerTab({ entries }: GeneralLedgerTabProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
        No journal entries posted in this date range.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <span className="font-bold text-slate-900">{entry.memo}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                {entry.branch_name || 'Main Branch'}
              </span>
            </div>
            <span className="text-slate-400">{new Date(entry.posted_at).toLocaleString('en-NG')}</span>
          </div>

          <div className="divide-y divide-slate-50">
            {entry.lines.map((line, i) => (
              <div key={i} className="py-1.5 flex items-center justify-between">
                <span className="text-slate-700">
                  <strong className="font-mono text-slate-900">{line.account_code}</strong> — {line.account_name || 'Ledger Account'}
                </span>
                <div className="flex gap-6 font-mono">
                  <span className="w-28 text-right text-slate-800">
                    {Number(line.debit) > 0 ? `Dr ₦${Number(line.debit).toLocaleString('en-NG')}` : ''}
                  </span>
                  <span className="w-28 text-right text-slate-600">
                    {Number(line.credit) > 0 ? `Cr ₦${Number(line.credit).toLocaleString('en-NG')}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
