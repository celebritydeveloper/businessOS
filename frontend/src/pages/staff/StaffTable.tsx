import { KeyRound } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { StaffTableProps } from './Staff.types';

export function StaffTable({ staff, onResetPin, onToggleStatus }: StaffTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
              <th className="py-3 px-4">Team Member</th>
              <th className="py-3 px-4">Branch &amp; Role</th>
              <th className="py-3 px-4">POS PIN</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((m) => {
              const isOwner = Boolean(Number(m.is_owner));
              const isActive = Boolean(Number(m.is_active));
              return (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{m.full_name}</p>
                    <p className="text-[11px] text-slate-500">{m.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{isOwner ? 'Account Owner' : m.role_name}</span>
                    <p className="text-[11px] text-slate-400">{isOwner ? 'All Branches' : m.branch_name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        Number(m.has_pos_pin) ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {Number(m.has_pos_pin) ? 'PIN Set' : 'Not Set'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button type="button" variant="secondary" onClick={() => onResetPin(m)}>
                      <KeyRound className="w-3.5 h-3.5" /> Set PIN
                    </Button>
                    {!isOwner && (
                      <Button type="button" variant={isActive ? 'danger' : 'secondary'} onClick={() => onToggleStatus(m)}>
                        {isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
