import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { AddBranchModal } from './AddBranchModal';
import { BusinessSwitcherDropdown } from './BusinessSwitcherDropdown';
import type { BusinessSwitcherProps } from './WorkspaceLayout.types';
import { WorkspaceSwitchOverlay } from './WorkspaceSwitchOverlay';
import { useNavigate } from 'react-router-dom';

export function BusinessSwitcher({
  businesses,
  activeBusiness,
  activeBranch,
  collapsed,
  onSelectBranch,
}: BusinessSwitcherProps) {
  const { me, refreshProfile } = useAuth();
  const isOwner = Boolean(me?.user.is_owner);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [switchingLabel, setSwitchingLabel] = useState<string | null>(null);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const triggerSwitch = (businessId: string, branchId: string, label: string, alreadySelected = false) => {
    setOpen(false);
    if (alreadySelected) return;
    setSwitchingLabel(label);
    onSelectBranch(businessId, branchId);
    window.setTimeout(() => setSwitchingLabel(null), 650);
  };

  const addBusiness = () => {
    navigate('/onboarding?mode=new')
  }

  return (
    <>
      <div ref={containerRef} className="relative px-3 py-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer ${
            collapsed ? 'justify-center p-2' : 'px-3 py-2.5 text-left'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{activeBusiness?.name || 'Select Business'}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeBranch?.name || 'Main Branch'}</p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            </>
          )}
        </button>

        {open && (
          <BusinessSwitcherDropdown
            businesses={businesses}
            activeBusiness={activeBusiness}
            activeBranch={activeBranch}
            isOwner={isOwner}
            onSelect={triggerSwitch}
            onOpenAddBranch={() => { setOpen(false); setAddBranchOpen(true); }}
            onOpenAddBusiness={addBusiness}
          />
        )}
      </div>

      <WorkspaceSwitchOverlay targetLabel={switchingLabel} />

      {activeBusiness && (
        <AddBranchModal
          open={addBranchOpen}
          businessId={activeBusiness.id}
          businessName={activeBusiness.name}
          onClose={() => setAddBranchOpen(false)}
          onCreated={async (id) => {
            await refreshProfile();
            triggerSwitch(activeBusiness.id, id, `${activeBusiness.name} (New Branch)`);
          }}
        />
      )}
    </>
  );
}
