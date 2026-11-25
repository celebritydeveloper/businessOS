import type { LucideIcon } from 'lucide-react';
import type { Branch, Business, Subscription, UserProfile } from '../../core/types';

export interface SidebarNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  section: 'core' | 'industry' | 'admin';
  badge?: string;
}

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  unread: boolean;
  type: 'info' | 'warning' | 'success';
}

export interface BusinessSwitcherProps {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBranch: Branch | null;
  collapsed: boolean;
  onSelectBranch: (businessId: string, branchId: string) => void;
}

export interface WorkspaceSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export interface WorkspaceTopbarProps {
  user: UserProfile | null;
  activeBusiness: Business | null;
  subscription: Subscription | null;
  onOpenMobileMenu: () => void;
  onLogout: () => Promise<void>;
}

export interface TrialCountdownBadgeProps {
  trialEndsAt?: string | null;
}

