import { ChevronRight } from 'lucide-react';

export interface BranchCashierOption {
  id: string;
  full_name: string;
  role_name: string;
  has_pin: boolean;
}

interface CashierSelectorListProps {
  cashiers: BranchCashierOption[];
  onSelect: (cashier: BranchCashierOption) => void;
}

export function CashierSelectorList({ cashiers, onSelect }: CashierSelectorListProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold text-white">Select Your Account</h2>
        <p className="text-xs text-brand-100">Tap your name to unlock the POS register</p>
      </div>

      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {cashiers.map((c) => {
        const initials = c.full_name.trim().split(/\s+/).map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase();

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 flex items-center justify-between transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{c.full_name}</p>
                  <p className="text-xs text-brand-100">{c.role_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                <span>{c.has_pin ? 'Enter PIN' : 'No PIN'}</span>
                <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
