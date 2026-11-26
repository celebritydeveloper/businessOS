import { Building2 } from 'lucide-react';

interface WorkspaceSwitchOverlayProps {
  targetLabel: string | null;
}

export function WorkspaceSwitchOverlay({ targetLabel }: WorkspaceSwitchOverlayProps) {
  if (!targetLabel) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-7 max-w-sm w-full text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Switching Workspace</h2>
          <p className="text-xs text-slate-500">
            Loading <strong>{targetLabel}</strong>...
          </p>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 w-2/3 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
