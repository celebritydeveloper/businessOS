import { Clock, Plus, Sprout } from 'lucide-react';
import { MockWorkspaceShell } from './MockWorkspaceShell';

export function AgricultureMockup() {
  const cycles = [
    {
      name: 'Broiler Batch #4 - Uyo Farm',
      sub: 'Livestock • Ross 308 Broilers',
      dayBadge: 'DAY 2 / 24',
      started: 'Started 2026-11-26',
      harvest: 'Target Harvest: 2026-12-20 (8%)',
      stockLabel: 'Surviving Stock',
      stockVal: '1,800 / 1,800 Birds',
      lossLabel: 'Mortality Rate',
      lossVal: '0.0% (0)',
      cost: '₦656,000',
      unitLabel: 'Cost / Birds',
      unitVal: '₦364',
      timelineCount: 6,
    },
    {
      name: 'Dry Season - Ikom Farm',
      sub: 'Crop • Tomatoes',
      dayBadge: 'DAY 2 / 73',
      started: 'Started 2026-11-26',
      harvest: 'Target Harvest: 2027-02-07 (3%)',
      stockLabel: 'Active Area/Yield',
      stockVal: '200 / 200 Hectares',
      lossLabel: 'Crop Loss',
      lossVal: '0.0% (0)',
      cost: '₦119,500',
      unitLabel: 'Cost / Hectares',
      unitVal: '₦598',
      timelineCount: 4,
    },
  ];

  return (
    <MockWorkspaceShell businessName="Obong Farms" branchName="Nsit Atai Farm" activeNav="Farm Cycles" industryNavs={['Farm Cycles', 'Batch & Expiry']}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-slate-900">Agriculture &amp; Production Cycles</p>
          <p className="text-[11px] text-slate-500">Manage livestock batches, crop seasons, and internal farm input supplies at Nsit Atai Farm.</p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Start New Cycle
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 text-[11px] font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-brand-600 text-white">Production Cycles (2)</span>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600">Farm Input Store (1)</span>
        </div>
        <div className="flex gap-1 text-[10px] font-bold">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white">All</span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">Active</span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">Harvested</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cycles.map((c) => (
          <div key={c.name} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" /> {c.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{c.sub}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">{c.dayBadge}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-2">
              <span>{c.started}</span>
              <span>{c.harvest}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px]">
              <div><p className="text-slate-400">{c.stockLabel}</p><p className="font-bold text-slate-900 mt-0.5">{c.stockVal}</p></div>
              <div><p className="text-slate-400">{c.lossLabel}</p><p className="font-bold text-slate-900 mt-0.5">{c.lossVal}</p></div>
              <div><p className="text-slate-400">Accumulated Cost</p><p className="font-bold text-slate-900 mt-0.5">{c.cost}</p></div>
              <div><p className="text-slate-400">{c.unitLabel}</p><p className="font-bold text-brand-600 mt-0.5">{c.unitVal}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold">
              <div className="py-2 rounded-lg border border-slate-200 text-slate-700 text-center flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Timeline ({c.timelineCount})
              </div>
              <div className="py-2 rounded-lg bg-brand-600 text-white text-center">
                Log Activity / Harvest
              </div>
            </div>
          </div>
        ))}
      </div>
    </MockWorkspaceShell>
  );
}
