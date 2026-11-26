import { CheckCircle2, X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { FarmCycleItem } from './Agriculture.types';

interface CycleTimelineModalProps {
  cycle: FarmCycleItem | null;
  onClose: () => void;
}

export function CycleTimelineModal({ cycle, onClose }: CycleTimelineModalProps) {
  if (!cycle) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{cycle.name}</h2>
            <p className="text-xs text-slate-500">
              {cycle.species_or_crop} &bull; {cycle.logs.length} timeline events
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cycle.logs.map((log) => (
            <div key={log.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-900">{log.title}</p>
                  <span className="text-[11px] text-slate-400 shrink-0">{log.log_date}</span>
                </div>
                {Number(log.cost_amount) > 0 && (
                  <p className="text-brand-600 font-semibold">
                    Cost: ₦{Number(log.cost_amount).toLocaleString('en-NG')}
                  </p>
                )}
                {log.notes && <p className="text-slate-600">{log.notes}</p>}
                <p className="text-[10px] text-slate-400">Logged by {log.actor_name || 'Staff'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
