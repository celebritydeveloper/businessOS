import type { ReactNode } from 'react';

interface MockWorkspaceShellProps {
  businessName: string;
  branchName: string;
  activeNav: string;
  industryNavs: string[];
  children: ReactNode;
}

export function MockWorkspaceShell({
  businessName,
  branchName,
  activeNav,
  industryNavs,
  children,
}: MockWorkspaceShellProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left">
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-mono text-slate-400">app.businessos.ng</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          ● Online
        </span>
      </div>

      <div className="grid grid-cols-12 bg-slate-50/70">
        <div className="hidden lg:block lg:col-span-3 bg-white border-r border-slate-200/80 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
            <span className="w-5 h-5 rounded bg-brand-600 text-white flex items-center justify-center text-[10px]">B</span>
            BusinessOS
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <p className="text-[11px] font-bold text-slate-900 truncate">{businessName}</p>
            <p className="text-[9px] text-slate-500 truncate">{branchName}</p>
          </div>

          <div className="space-y-0.5 text-[10px] font-medium text-slate-600">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">Core Operations</p>
            {['Dashboard', 'POS Terminal', 'Catalog & Stock'].map((item) => (
              <div key={item} className={`px-2.5 py-1 rounded-md truncate ${item === activeNav ? 'bg-brand-600 text-white font-bold' : ''}`}>
                {item}
              </div>
            ))}

            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1.5">Industry Tools</p>
            {industryNavs.map((item) => (
              <div key={item} className={`px-2.5 py-1 rounded-md truncate ${item === activeNav ? 'bg-brand-600 text-white font-bold' : ''}`}>
                {item}
              </div>
            ))}

            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1.5">Administration</p>
            {['Staff & PINs', 'Accounting & P&L'].map((item) => (
              <div key={item} className={`px-2.5 py-1 rounded-md truncate ${item === activeNav ? 'bg-brand-600 text-white font-bold' : ''}`}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 flex flex-col">
          <div className="bg-white border-b border-slate-200/70 px-4 py-2 flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">VAT Exempt (0%)</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">● Online</span>
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[9px] flex items-center justify-center">SA</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
