import type { StatCardProps } from '../../pages/dashboard/Dashboard.types';

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-brand-600',
}: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-semibold">{label}</span>
        <Icon className={`w-4 h-4 ${iconColorClass}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}
