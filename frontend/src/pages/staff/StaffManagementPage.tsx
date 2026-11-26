import { useCallback, useEffect, useState } from 'react';
import { ShieldPlus, UserPlus } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import { AddStaffModal } from './AddStaffModal';
import { CustomRoleModal } from './CustomRoleModal';
import type { BusinessRoleItem, StaffAndRolesResponse, StaffMemberItem } from './Staff.types';
import { StaffTable } from './StaffTable';

export function StaffManagementPage() {
  const { activeBusiness } = useAuth();
  const [staff, setStaff] = useState<StaffMemberItem[]>([]);
  const [roles, setRoles] = useState<BusinessRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addRoleOpen, setAddRoleOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const res = await apiFetch<StaffAndRolesResponse>(`/workspace/businesses/${activeBusiness.id}/staff`);
    if (res.ok && res.body.data) {
      setStaff(res.body.data.staff);
      setRoles(res.body.data.roles);
    }
    setLoading(false);
  }, [activeBusiness?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleResetPin = async (member: StaffMemberItem) => {
    const pin = window.prompt(`Enter a new 4-digit POS PIN for ${member.full_name}:`);
    if (!pin) return;
    if (!/^\d{4}$/.test(pin.trim())) {
      toast.error('POS PIN must be exactly 4 digits.', 'Invalid PIN');
      return;
    }

    const res = await apiFetch(`/workspace/staff/${member.id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ pos_pin: pin.trim() }),
    });
    if (!res.ok) {
      toast.error(res.body.message || 'Could not update POS PIN.', 'Error');
      return;
    }
    toast.success(`4-digit POS PIN updated for ${member.full_name}.`, 'PIN Saved');
    void loadData();
  };

  const handleToggleStatus = async (member: StaffMemberItem) => {
    const nextActive = !Boolean(Number(member.is_active));
    const res = await apiFetch(`/workspace/staff/${member.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: nextActive }),
    });
    if (!res.ok) {
      toast.error(res.body.message || 'Could not update staff status.', 'Error');
      return;
    }
    toast.success(`${member.full_name} is now ${nextActive ? 'active' : 'suspended'}.`, 'Updated');
    void loadData();
  };

  if (!activeBusiness) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Staff, Roles &amp; POS PINs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage team access, custom roles, and 4-digit cashier shift PINs for <strong>{activeBusiness.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="secondary" onClick={() => setAddRoleOpen(true)}>
            <ShieldPlus className="w-4 h-4" /> Custom Role
          </Button>
          <Button type="button" onClick={() => setAddStaffOpen(true)}>
            <UserPlus className="w-4 h-4" /> Invite Staff
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-700 mr-1">Available Roles:</span>
        {roles.map((r) => (
          <span key={r.id} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            {r.name} ({r.permissions.length} perms)
          </span>
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading staff &amp; roles...</div>
      ) : (
        <StaffTable
          staff={staff}
          onResetPin={(m) => void handleResetPin(m)}
          onToggleStatus={(m) => void handleToggleStatus(m)}
        />
      )}

      <AddStaffModal
        open={addStaffOpen}
        businessId={activeBusiness.id}
        branches={activeBusiness.branches}
        roles={roles}
        onClose={() => setAddStaffOpen(false)}
        onCreated={() => void loadData()}
      />

      <CustomRoleModal
        open={addRoleOpen}
        businessId={activeBusiness.id}
        onClose={() => setAddRoleOpen(false)}
        onCreated={() => void loadData()}
      />
    </div>
  );
}
