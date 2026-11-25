import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Pill, Store } from 'lucide-react';
import type { BusinessSwitcherProps } from './WorkspaceLayout.types';

export function BusinessSwitcher({
  businesses,
  activeBusiness,
  activeBranch,
  collapsed,
  onSelectBranch,
}: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const IndustryIcon = activeBusiness?.industry_type === 'pharmacy' ? Pill : Store;

  return (
    <div ref={containerRef} className="relative px-3 py-3 border-b border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={activeBusiness ? `${activeBusiness.name} — ${activeBranch?.name || ''}` : 'Switch Business'}
        className={`w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer ${
          collapsed ? 'justify-center p-2' : 'px-3 py-2.5 text-left'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <IndustryIcon className="w-4 h-4" />
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {activeBusiness?.name || 'Select Business'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {activeBranch?.name || 'Main Branch'}
              </p>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-3 right-3 mt-1.5 min-w-[230px] bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-2">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Businesses &amp; Branches
          </p>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {businesses.map((biz) => (
              <div key={biz.id} className="py-1.5">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{biz.name}</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {biz.industry_type}
                  </span>
                </div>
                {biz.branches.map((branch) => {
                  const isSelected = biz.id === activeBusiness?.id && branch.id === activeBranch?.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onSelectBranch(biz.id, branch.id);
                        setOpen(false);
                      }}
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
        </div>
      )}
    </div>
  );
}
