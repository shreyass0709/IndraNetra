'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { copy } from '../../lib/copy';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{user?.name ?? '…'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-secondary"
          >
            <User className="h-4 w-4" /> {copy.shell.profile}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive transition hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> {copy.common.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({
  onOpenMobile,
  collapsed,
  onToggleCollapse,
}: {
  onOpenMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label={copy.shell.openMenu}
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? copy.shell.expand : copy.shell.collapse}
        className="hidden rounded-lg p-2 text-muted-foreground transition hover:bg-secondary md:inline-flex"
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <div className="flex-1" />

      <NotificationBell />
      <ThemeToggle />
      <ProfileMenu />
    </header>
  );
}
