import {
  LayoutDashboard,
  Calendar,
  Video,
  Siren,
  BarChart3,
  Users,
  Settings,
  ClipboardList,
  FileWarning,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { copy } from '../../lib/copy';
import type { Role } from '../../hooks/useAuth';

/**
 * The sidebar contract: exactly the §2 features each role has, no more.
 *
 * `ready` marks routes whose page exists today. Not-ready items still render (so the
 * full menu is visible from Phase 2) but as a disabled "Soon" row rather than a link
 * that 404s -- the spec forbids dead links. Flip `ready` to true as each later phase
 * ships that page; nothing else changes.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ready?: boolean;
}

const n = copy.nav;

function items(role: Lowercase<Role>): Record<string, NavItem> {
  const base = `/${role}`;
  return {
    dashboard: { label: n.dashboard, href: `${base}/dashboard`, icon: LayoutDashboard, ready: true },
    events: { label: n.events, href: `${base}/events`, icon: Calendar },
    monitoring: { label: n.monitoring, href: `${base}/monitoring`, icon: Video },
    emergency: { label: n.emergency, href: `${base}/emergency`, icon: Siren },
    analytics: { label: n.analytics, href: `${base}/analytics`, icon: BarChart3 },
    users: { label: n.users, href: `${base}/users`, icon: Users },
    settings: { label: n.settings, href: `${base}/settings`, icon: Settings },
    tasks: { label: n.tasks, href: `${base}/tasks`, icon: ClipboardList },
    report: { label: n.report, href: `${base}/report`, icon: FileWarning },
    sos: { label: n.sos, href: `${base}/sos`, icon: LifeBuoy },
  };
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: (() => {
    const i = items('admin');
    return [i.dashboard, i.events, i.monitoring, i.emergency, i.analytics, i.users, i.settings];
  })(),
  ORGANIZER: (() => {
    const i = items('organizer');
    return [i.dashboard, i.events, i.monitoring, i.emergency, i.analytics, i.settings];
  })(),
  VOLUNTEER: (() => {
    const i = items('volunteer');
    return [i.dashboard, i.tasks, i.report, i.settings];
  })(),
  PUBLIC: (() => {
    const i = items('public');
    return [i.dashboard, i.sos, i.settings];
  })(),
};
