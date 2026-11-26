import { Check, GitBranchPlus, PlusCircle } from 'lucide-react';
import type { Branch, Business } from '../../core/types';

interface BusinessSwitcherDropdownProps {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBranch: Branch | null;
  isOwner: boolean;
  onSelect: (businessId: string, branchId: string, label: string, alreadySelected: boolean) => void;
  onOpenAddBranch: () => void;
  onOpenAddBusiness: () => void;
}

export function BusinessSwitcherDropdown({
  businesses,
  activeBusiness,
  activeBranch,
  isOwner,
  onSelect,
  onOpenAddBranch,
  onOpenAddBusiness,
}: BusinessSwitcherDropdownProps) {
  return (
    <div className="absolute left-3 right-3 mt-1.5 min-w-[245px] bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-2">
      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Businesses &amp; Branches
      </p>

      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
        {businesses.map((biz) => (
          <div key={biz.id} className="py-1.5">
            <div className="px-3 py-1 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 truncate">{biz.name}</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                {biz.industry_type}
              </span>
            </div>

            {biz.branches.map((branch) => {
              const isSelected = biz.id === activeBusiness?.id && branch.id === activeBranch?.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelect(biz.id, branch.id, `${biz.name} — ${branch.name}`, isSelected)}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-xs text-slate-600 hover:bg-brand-50 hover:text-brand-700 cursor-pointer"
                >
                  <span className="truncate">{branch.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="border-t border-slate-100 mt-1.5 pt-1.5 px-2 space-y-1">
          {activeBusiness && (
            <button
              type="button"
              onClick={onOpenAddBranch}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 cursor-pointer"
            >
              <GitBranchPlus className="w-3.5 h-3.5" /> Add Branch to {activeBusiness.name}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddBusiness}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-600" /> Create New Business
          </button>
        </div>
      )}
    </div>
  );
}
