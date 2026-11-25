import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CreditCard, LogOut, Menu, Shield, User, Wifi, WifiOff } from 'lucide-react';
import { syncEngine, type SyncStatus } from '../../core/sync/syncEngine';
import type { WorkspaceNotification, WorkspaceTopbarProps } from './WorkspaceLayout.types';
import { TrialCountdownBadge } from './TrialCountdownBadge';

export function WorkspaceTopbar({
  user,
  activeBusiness,
  subscription,
  onOpenMobileMenu,
  onLogout,
}: WorkspaceTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    conflictCount: 0,
    lastSyncedAt: null,
  });

  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([
    {
      id: 'welcome-trial',
      title: '24-Hour Free Trial Active',
      message: 'Your workspace is ready. Explore POS, catalog, and multi-branch tools.',
      timeAgo: 'Just now',
      unread: true,
      type: 'success',
    },
  ]);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => syncEngine.subscribe(setSyncState), []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const initials = (user?.full_name || 'U')
    .split(' ')
    .map((p) => p)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left: Mobile Drawer Trigger + VAT Status Pill */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
          {activeBusiness?.is_vat_registered
            ? `VAT Registered (${activeBusiness.default_vat_rate}%)`
            : 'VAT Exempt (0%)'}
        </span>
      </div>

      {/* Right Action Cluster: Sync Pill, Trial Pill, Notification Popup, User Popup */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Online / Offline + Sync Status */}
        <button
          type="button"
          onClick={() => void syncEngine.flushOutbox()}
          title="Click to sync pending offline events"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
            syncState.isOnline
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {syncState.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">
            {syncState.isOnline ? 'Online' : 'Offline'}
            {syncState.pendingCount > 0 ? ` (${syncState.pendingCount})` : ''}
          </span>
        </button>

        {/* Trial / Subscription Badge */}
                {/* Trial / Subscription Badge (Owner Only) */}
        {user?.is_owner && subscription?.status === 'trialing' && (
          <TrialCountdownBadge trialEndsAt={subscription.trial_ends_at} />
        )}



        {/* Notification Bell + Popup */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No notifications yet.</p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 text-xs ${item.unread ? 'bg-brand-50/40' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{item.timeAgo}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Icon + Popup Menu */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="User menu"
            className="w-9 h-9 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-sm hover:bg-brand-700 cursor-pointer"
          >
            {initials || <User className="w-4 h-4" />}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-40 py-2">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || (user?.is_owner ? 'Account Owner' : 'Staff Member')}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/dashboard/staff"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Shield className="w-4 h-4 text-slate-400" /> Staff &amp; Sessions
                </Link>
                {user?.is_owner && (
                  <Link
                    to="/dashboard/billing"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" /> Billing &amp; Subscription
                  </Link>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    void onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
