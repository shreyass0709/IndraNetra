'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { Role } from '../../hooks/useAuth';

/**
 * The chrome every signed-in page sits in: sidebar + header + scrollable content.
 *
 * `role` comes from the server layout (which already verified it), so the sidebar
 * renders the right menu with no client fetch and no flash. The header's profile
 * details load client-side via useAuth.
 */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the desktop collapsed preference. Read in an effect (not initial state)
  // so server and first client render agree and hydration doesn't mismatch.
  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
  }, []);

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card md:block ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <Sidebar role={role} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card">
            <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
