import { MockWorkspaceShell } from './MockWorkspaceShell';
export { AgricultureMockup } from './AgricultureScreenMockup';

export function AccountingMockup() {
  return (
    <MockWorkspaceShell
      businessName="Marvy Pharmacy"
      branchName="Main Branch"
      activeNav="Accounting & P&L"
      industryNavs={['Batch & Expiry']}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold text-slate-900">Accounting &amp; Financial Reports</p>
          <p className="text-[11px] text-slate-400">Profit &amp; Loss • Double-Entry General Ledger</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-brand-600 text-white text-[10px] font-bold">+ Add Expense</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Total Net Revenue</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">₦2,480,900.00</p>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Gross Profit (33.9% Margin)</p>
          <p className="text-sm font-extrabold text-brand-600 mt-0.5">₦841,025.00</p>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Net Operating Profit</p>
          <p className="text-sm font-extrabold text-emerald-700 mt-0.5">₦712,500.00</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 divide-y divide-slate-100 text-xs">
        <div className="pb-2 flex justify-between"><span>4000 — Sales &amp; Service Revenue (Net of VAT)</span><span className="font-mono font-bold">₦2,480,900.00</span></div>
        <div className="py-2 flex justify-between text-rose-600"><span>5000 — Cost of Goods Sold (COGS)</span><span className="font-mono">- ₦1,639,875.00</span></div>
        <div className="py-2 flex justify-between text-rose-600"><span>6000 — Operating Expenses</span><span className="font-mono">- ₦128,525.00</span></div>
        <div className="pt-2 flex justify-between font-extrabold text-emerald-700"><span>Net Profit / (Loss)</span><span className="font-mono">₦712,500.00</span></div>
      </div>
    </MockWorkspaceShell>
  );
}

export function ExpiryMockup() {
  return (
    <MockWorkspaceShell
      businessName="Marvy Pharmacy"
      branchName="Main Branch"
      activeNav="Batch & Expiry"
      industryNavs={['Batch & Expiry']}
    >
      <div>
        <p className="text-sm font-extrabold text-slate-900">Batch &amp; FEFO Expiry Monitor</p>
        <p className="text-[11px] text-slate-400">First-Expired, First-Out (FEFO) batch tracking • Expired lots blocked at POS</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Active Batches</p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">13 Lots</p>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Expiring Within 30 Days</p>
          <p className="text-sm font-extrabold text-amber-600 mt-0.5">2 Lots</p>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <p className="text-[10px] text-slate-400">Expired Lots Sold</p>
          <p className="text-sm font-extrabold text-rose-600 mt-0.5">0 Blocked</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 divide-y divide-slate-100 text-xs">
        <div className="pb-2.5 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">Amoxicillin Capsule 500MG</p>
            <p className="text-[10px] font-mono text-slate-400">Batch BN-467464 • Remaining Qty: 19.000</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Expires in 2d</span>
        </div>
        <div className="pt-2.5 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">Artemether-Lumefantrine Tabs</p>
            <p className="text-[10px] font-mono text-slate-400">Batch BN-489460 • Remaining Qty: 44.000</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">448d left</span>
        </div>
      </div>
    </MockWorkspaceShell>
  );
}
