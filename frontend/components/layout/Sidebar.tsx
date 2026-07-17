'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { copy } from '../../lib/copy';
import { NAV_BY_ROLE, type NavItem } from './nav';
import type { Role } from '../../hooks/useAuth';

function Row({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const base =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition';

  // Not-ready features render as a muted, non-interactive row -- visible so the role's
  // full menu is on screen, but never a link that 404s (REBUILD_SPEC.md Phase 2).
  if (!item.ready) {
    return (
      <div
        className={`${base} cursor-default text-muted-foreground/60`}
        title={collapsed ? item.label : undefined}
        aria-disabled="true"
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && (
          <span className="flex flex-1 items-center justify-between">
            {item.label}
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
              {copy.nav.soon}
            </span>
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={`${base} ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-foreground/80 hover:bg-secondary hover:text-foreground'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Main">
      <Link
        href="/"
        onClick={onNavigate}
        className={`mb-4 flex h-10 items-center px-2 text-lg font-semibold tracking-tight text-foreground ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {collapsed ? 'I' : copy.app.name}
      </Link>

      {items.map((item) => (
        <Row
          key={item.href}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
          active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );
}
