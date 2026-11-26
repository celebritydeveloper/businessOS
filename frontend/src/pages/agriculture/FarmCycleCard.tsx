import { Calendar, ClipboardPlus, History, Sprout } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { FarmCycleItem } from './Agriculture.types';

interface FarmCycleCardProps {
  cycle: FarmCycleItem;
  onOpenTimeline: (cycle: FarmCycleItem) => void;
  onQuickLog: (cycle: FarmCycleItem) => void;
}

export function FarmCycleCard({ cycle, onOpenTimeline, onQuickLog }: FarmCycleCardProps) {
  const initQty = Number(cycle.initial_quantity || 0);
  const currQty = Number(cycle.current_quantity || 0);
  const lostQty = Math.max(0, initQty - currQty);
  const mortalityPct = initQty > 0 ? ((lostQty / initQty) * 100).toFixed(1) : '0.0';
  const totalCost = Number(cycle.accumulated_cost || 0);
  const costPerUnit = currQty > 0 ? totalCost / currQty : 0;

  const startMs = new Date(cycle.start_date).getTime();
  const endMs = new Date(cycle.expected_harvest_date).getTime();
  const nowMs = Date.now();
  const totalDays = Math.max(1, Math.round((endMs - startMs) / 86400000));
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((nowMs - startMs) / 86400000)));
  const progressPct = cycle.status === 'harvested' ? 100 : Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{cycle.name}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            {cycle.cycle_type} &bull; <strong>{cycle.species_or_crop}</strong>
          </p>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
            cycle.status === 'active'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {cycle.status === 'active' ? `Day ${elapsedDays} / ${totalDays}` : cycle.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Started {cycle.start_date}
          </span>
          <span>Target Harvest: <strong>{cycle.expected_harvest_date}</strong> ({progressPct}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className={`h-full rounded-full transition-all ${
              cycle.status === 'harvested' ? 'bg-brand-600' : 'bg-emerald-600'
            }`}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-400">
            {cycle.cycle_type === 'livestock' ? 'Surviving Stock' : 'Active Area/Yield'}
          </p>
          <p className="font-bold text-slate-900 mt-0.5">
            {currQty.toLocaleString()} / {initQty.toLocaleString()} {cycle.unit_label}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-400">
            {cycle.cycle_type === 'livestock' ? 'Mortality Rate' : 'Crop Loss'}
          </p>
          <p className="font-bold text-slate-900 mt-0.5">{mortalityPct}% ({lostQty})</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-400">Accumulated Cost</p>
          <p className="font-bold text-slate-900 mt-0.5">₦{totalCost.toLocaleString('en-NG')}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] text-slate-400">Cost / {cycle.unit_label}</p>
          <p className="font-bold text-brand-600 mt-0.5">₦{Math.round(costPerUnit).toLocaleString('en-NG')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={() => onOpenTimeline(cycle)}>
          <History className="w-3.5 h-3.5" /> Timeline ({cycle.logs.length})
        </Button>
        {cycle.status === 'active' && (
          <Button type="button" onClick={() => onQuickLog(cycle)}>
            <ClipboardPlus className="w-3.5 h-3.5" /> Log Activity / Harvest
          </Button>
        )}
      </div>
    </div>
  );
}
