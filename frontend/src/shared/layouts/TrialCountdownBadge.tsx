import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TrialCountdownBadgeProps } from './WorkspaceLayout.types';

function formatRemaining(targetIso?: string | null): string {
  if (!targetIso) return '24h Trial Active';
  const normalized = targetIso.endsWith('Z') ? targetIso : `${targetIso.replace(' ', 'T')}Z`;
  const diffMs = new Date(normalized).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 'Trial Expired';

  const totalSec = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `Trial: ${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export function TrialCountdownBadge({ trialEndsAt }: TrialCountdownBadgeProps) {
  const [label, setLabel] = useState<string>(() => formatRemaining(trialEndsAt));

  useEffect(() => {
    setLabel(formatRemaining(trialEndsAt));
    const timer = setInterval(() => {
      setLabel(formatRemaining(trialEndsAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [trialEndsAt]);

  return (
    <Link
      to="/dashboard/billing"
      title="Click to upgrade plan"
      className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 tabular-nums"
    >
      {label}
    </Link>
  );
}
