import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { QuickActionCardProps } from '../../pages/dashboard/Dashboard.types';

export function QuickActionCard({ title, description, to }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-600/40 transition-all flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 shrink-0 transition-colors" />
    </Link>
  );
}
