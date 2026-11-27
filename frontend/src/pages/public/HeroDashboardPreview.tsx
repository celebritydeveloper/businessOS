import { AlertTriangle, Clock, Receipt, TrendingUp } from 'lucide-react';

export function HeroDashboardPreview() {
  return (
    <div className="max-w-5xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-left">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-mono text-slate-400">businessos.ng/dashboard</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          ● Online • Synced
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-50/60">
        {/* Mini Sidebar */}
        <div className="hidden md:block md:col-span-3 bg-white border-r border-slate-200/80 p-4 space-y-3">
          <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
            <span className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center text-xs">B</span>
            BusinessOS
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-bold text-slate-900">Marvy Pharmacy</p>
            <p className="text-[10px] text-slate-500">Main Branch</p>
          </div>
          <div className="space-y-1 text-xs font-medium text-slate-600 pt-1">
            <div className="px-3 py-2 rounded-lg bg-brand-600 text-white font-bold">Dashboard</div>
            <div className="px-3 py-1.5">POS Terminal</div>
            <div className="px-3 py-1.5">Catalog &amp; Stock</div>
            <div className="px-3 py-1.5">Customers &amp; Credit</div>
            <div className="px-3 py-1.5">Batch &amp; Expiry</div>
            <div className="px-3 py-1.5">Accounting &amp; P&amp;L</div>
          </div>
        </div>

        {/* Main Dashboard Canvas */}
        <div className="md:col-span-9 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Welcome back, Saviour Essien</h3>
              <p className="text-[11px] text-slate-500">Marvy Pharmacy • Main Branch</p>
            </div>
            <div className="flex gap-2 text-[11px] font-bold">
              <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700">+ Add Product</span>
              <span className="px-3 py-1.5 rounded-lg bg-brand-600 text-white">Open POS Terminal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
              <p className="text-[11px] text-slate-500 flex items-center justify-between">Today&apos;s Revenue <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /></p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">₦184,500.00</p>
              <p className="text-[10px] text-slate-400">Month-to-date: ₦2.48M</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
              <p className="text-[11px] text-slate-500">Completed Sales</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">28</p>
              <p className="text-[10px] text-slate-400">Branch receipts today</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
              <p className="text-[11px] text-slate-500">Net Profit (MTD)</p>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">₦642,300</p>
              <p className="text-[10px] text-slate-400">33.9% Gross Margin</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
              <p className="text-[11px] text-slate-500">Expiring Batches</p>
              <p className="text-base sm:text-lg font-extrabold text-amber-600 mt-1">2</p>
              <p className="text-[10px] text-slate-400">FEFO alerts active</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-2.5">
              <p className="text-xs font-bold text-slate-900">Stock &amp; Expiry Alerts</p>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-amber-900 font-medium"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low-Stock Products</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-bold text-[10px]">3 items</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-rose-900 font-medium"><Clock className="w-3.5 h-3.5 text-rose-600" /> Expiring Within 30 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-900 font-bold text-[10px]">2 lots</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-2 text-xs">
              <p className="font-bold text-slate-900 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-brand-600" /> Recent Branch Receipts</p>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-mono text-[11px] text-slate-700">BOS-20261127-2962</span>
                <span className="font-bold text-slate-900">₦14,780</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-mono text-[11px] text-slate-700">BOS-20261127-7597</span>
                <span className="font-bold text-slate-900">₦5,410</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-[11px] text-slate-700">BOS-20261126-1682</span>
                <span className="font-bold text-slate-900">₦28,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
