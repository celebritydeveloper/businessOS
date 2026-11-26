import type { Branch } from '../../core/types';

export interface BusinessRoleItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  is_system: number | boolean;
}

export interface StaffMemberItem {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_owner: number | boolean;
  is_active: number | boolean;
  has_pos_pin: number | boolean;
  branch_id: string | null;
  branch_name: string | null;
  role_slug: string | null;
  role_id: string | null;
  role_name: string | null;
}

export interface StaffAndRolesResponse {
  roles: BusinessRoleItem[];
  staff: StaffMemberItem[];
}

export interface PermissionOption {
  key: string;
  label: string;
}

export const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { key: 'dashboard.view', label: 'View Branch Dashboard & KPIs' },
  { key: 'pos.sell', label: 'POS Checkout & Sales' },
  { key: 'sales.view', label: 'View Sales & Reprint Receipts' },
  { key: 'farm.manage', label: 'Manage Livestock & Crop Cycles' },
  { key: 'catalog.manage', label: 'Add / Edit Catalog Items' },
  { key: 'inventory.restock', label: 'Restock & Adjust Inventory' },
  { key: 'transfers.manage', label: 'Dispatch & Receive Stock Transfers' },
  { key: 'batches.manage', label: 'Pharmacy Batch & FEFO Expiry Control' },
  { key: 'staff.manage', label: 'Manage Staff & 4-Digit POS PINs' },
  { key: 'audit.view', label: 'View Activity Audit Logs' },
  { key: 'accounting.view', label: 'View Accounting, Trial Balance & P&L' },
  { key: 'billing.manage', label: 'Manage Subscription & Billing' },
  { key: 'settings.manage', label: 'Edit Business Branding & Settings' },
];

export interface AddStaffModalProps {
  open: boolean;
  businessId: string;
  branches: Branch[];
  roles: BusinessRoleItem[];
  onClose: () => void;
  onCreated: () => void;
}

export interface CustomRoleModalProps {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onCreated: () => void;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  actor_name: string | null;
  actor_role?: string | null;
  branch_name: string | null;
}

export interface ActivityLogsResponse {
  logs: ActivityLogItem[];
}

export interface StaffTableProps {
  staff: StaffMemberItem[];
  onResetPin: (member: StaffMemberItem) => void;
  onToggleStatus: (member: StaffMemberItem) => void;
}

