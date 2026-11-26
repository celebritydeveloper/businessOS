export type AccountingTabKey = 'pnl' | 'trial_balance' | 'ledger';

export interface ProfitAndLossSummary {
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
}

export interface TrialBalanceAccount {
  code: string;
  name: string;
  description?: string | null;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  total_debit: number;
  total_credit: number;
}


export interface JournalLineItem {
  account_code: string;
  account_name: string | null;
  debit: number | string;
  credit: number | string;
}

export interface JournalEntryItem {
  id: string;
  reference_type: string;
  memo: string;
  posted_at: string;
  branch_name: string | null;
  lines: JournalLineItem[];
}

export interface AccountingReportResponse {
  period: { date_from: string; date_to: string };
  pnl: ProfitAndLossSummary;
  trial_balance: {
    accounts: TrialBalanceAccount[];
    total_debits: number;
    total_credits: number;
  };
  journal_entries: JournalEntryItem[];
}
