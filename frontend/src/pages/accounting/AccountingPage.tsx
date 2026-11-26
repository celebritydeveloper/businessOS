import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Download, FileSpreadsheet, Scale } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import type { AccountingReportResponse, AccountingTabKey } from './Accounting.types';
import { GeneralLedgerTab } from './GeneralLedgerTab';
import { ProfitAndLossTab } from './ProfitAndLossTab';
import { TrialBalanceTab } from './TrialBalanceTab';
import { RecordExpenseModal } from './RecordExpenseModal';

export function AccountingPage() {
  const { activeBusiness } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 8)}01`;
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [tab, setTab] = useState<AccountingTabKey>('pnl');
  const [branchId, setBranchId] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [data, setData] = useState<AccountingReportResponse | null>(null);
  const expenseAccounts = (data?.trial_balance.accounts || []).filter((a) => a.account_type === 'expense' && a.code !== '5000');

  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (branchId) params.set('branch_id', branchId);

    const res = await apiFetch<AccountingReportResponse>(`/workspace/businesses/${activeBusiness.id}/accounting?${params.toString()}`);
    if (res.ok && res.body.data) setData(res.body.data);
    setLoading(false);
  }, [activeBusiness?.id, branchId, dateFrom, dateTo]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['Account Code', 'Account Name', 'Type', 'Debit (NGN)', 'Credit (NGN)'],
      ...data.trial_balance.accounts.map((a) => [a.code, a.name, a.account_type, String(a.total_debit), String(a.total_credit)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeBusiness) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Accounting &amp; Financial Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated double-entry Profit &amp; Loss, Trial Balance, and General Ledger for <strong>{activeBusiness.name}</strong>.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={!data}>
          <Download className="w-4 h-4" /> Export Trial Balance CSV
        </Button>
        <Button type="button" variant="primary" onClick={() => setExpenseModalOpen(true)}>
          <Download className="w-4 h-4" /> Add Expenses
        </Button>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('pnl')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'pnl' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Profit &amp; Loss
          </button>
          <button
            type="button"
            onClick={() => setTab('trial_balance')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'trial_balance' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Trial Balance
          </button>
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'ledger' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> General Ledger
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Branches</option>
            {activeBusiness.branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 px-2.5 rounded-lg border border-slate-200" />
          <span className="text-slate-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 px-2.5 rounded-lg border border-slate-200" />
        </div>
      </div>

      {loading || !data ? (
        <div className="p-10 text-center text-xs text-slate-500">Generating financial statements...</div>
      ) : (
        <>
          {tab === 'pnl' && <ProfitAndLossTab pnl={data.pnl} />}
          {tab === 'trial_balance' && (
            <TrialBalanceTab
              accounts={data.trial_balance.accounts}
              totalDebits={data.trial_balance.total_debits}
              totalCredits={data.trial_balance.total_credits}
            />
          )}
          {tab === 'ledger' && <GeneralLedgerTab entries={data.journal_entries} />}
        </>
      )}

      <RecordExpenseModal open={expenseModalOpen} businessId={activeBusiness.id} branches={activeBusiness.branches} expenseAccounts={expenseAccounts} onClose={() => setExpenseModalOpen(false)} onRecorded={() => void loadReports()} />
    </div>
  );
}
