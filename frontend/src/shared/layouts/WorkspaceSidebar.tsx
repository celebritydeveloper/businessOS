import { NavLink } from 'react-router-dom';
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Package,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Sprout,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { getIndustryCapabilities } from '../../core/config/industryCapabilities';
import { BrandLogo } from '../ui/BrandLogo';
import { BusinessSwitcher } from './BusinessSwitcher';
import type { SidebarNavItem, WorkspaceSidebarProps } from './WorkspaceLayout.types';

export function WorkspaceSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const { me, activeBusiness, activeBranch, setActiveBranch } = useAuth();
  const isOwner = Boolean(me?.user.is_owner);
  const branchPerms = activeBranch?.permissions || [];
  const can = (perm: string) => isOwner || branchPerms.includes('*') || branchPerms.includes(perm);
  const caps = getIndustryCapabilities(activeBusiness?.industry_type);


  const capabilities = getIndustryCapabilities(activeBusiness?.industry_type);
  const hasMultipleBranches = (activeBusiness?.branches.length ?? 0) > 1;

  const navItems: SidebarNavItem[] = [
    ...(can('dashboard.view') ? [{ id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'core' as const }] : []),
    ...(can('pos.sell') ? [{ id: 'pos', label: 'POS Terminal', path: '/dashboard/pos', icon: ShoppingCart, section: 'core' as const }] : []),
    ...(can('catalog.manage') || can('inventory.restock') ? [{ id: 'catalog', label: 'Catalog & Stock', path: '/dashboard/catalog', icon: Package, section: 'core' as const }] : []),
    ...(hasMultipleBranches && can('transfers.manage') ? [{ id: 'transfers', label: 'Stock Transfers', path: '/dashboard/transfers', icon: ArrowLeftRight, section: 'core' as const }] : []),
    ...(can('sales.view') ? [{ id: 'sales', label: 'Sales & Receipts', path: '/dashboard/sales', icon: Receipt, section: 'core' as const }] : []),
    ...(caps.supportsFarmCycles && can('farm.manage') ? [{ id: 'farm-cycles', label: 'Farm Cycles', path: '/dashboard/farm-cycles', icon: Sprout, section: 'core' as const }] : []),
    ...(capabilities.supportsBatchExpiry && can('batches.manage')
      ? [{ id: 'batches', label: 'Batch & Expiry', path: '/dashboard/batches', icon: Pill, section: 'industry' as const }]
      : []),
    ...(can('staff.manage') ? [{ id: 'staff', label: 'Staff & PINs', path: '/dashboard/staff', icon: Users, section: 'admin' as const }] : []),
    ...(can('audit.view') ? [{ id: 'audit', label: 'Activity Logs', path: '/dashboard/audit', icon: Activity, section: 'admin' as const }] : []),
    ...(can('accounting.view') ? [{ id: 'accounting', label: 'Accounting & P&L', path: '/dashboard/accounting', icon: BookOpen, section: 'admin' as const }] : []),
    { id: 'settings', label: 'Settings', path: '/dashboard/settings', icon: Settings, section: 'admin' },
    ...(can('billing.manage') ? [{ id: 'billing', label: 'Billing & Plan', path: '/dashboard/billing', icon: CreditCard, section: 'admin' as const }] : []),
  ];

  const sidebarContent = (
    <aside
      className={`h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}
    >
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <BrandLogo iconOnly={collapsed} size="sm" />

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Shrink sidebar'}
          className="hidden lg:flex w-7 h-7 rounded-lg border border-slate-200 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <BusinessSwitcher
        businesses={me?.businesses || []}
        activeBusiness={activeBusiness}
        activeBranch={activeBranch}
        collapsed={collapsed}
        onSelectBranch={setActiveBranch}
      />

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40" onClick={onCloseMobile} />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
