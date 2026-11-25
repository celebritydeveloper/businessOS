import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceTopbar } from './WorkspaceTopbar';

const SIDEBAR_COLLAPSED_KEY = 'bos_sidebar_collapsed';

export function WorkspaceLayout() {
  const { me, activeBusiness, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden flex bg-canvas">
      <WorkspaceSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <WorkspaceTopbar
          user={me?.user || null}
          activeBusiness={activeBusiness}
          subscription={me?.subscription || null}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
