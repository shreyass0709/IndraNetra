// Pure helpers shared across the dashboard. No state, no side effects.

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Calendar,
  Users,
  Camera as CameraIcon,
  ShieldAlert,
  BarChart3,
  Settings,
  User,
  Home,
  Send,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Real URL for this module. The sidebar links here; `id` stays the key the
   *  page body switches on until every module is extracted to its own file. */
  href: string;
}

/**
 * Single source of truth for which modules each role can reach.
 * The sidebar renders exactly this list, and it is also the routing
 * allowlist — `canAccessPath` gates navigation on it, so a role can never
 * reach a module that is not listed here, by link or by typed URL.
 */
export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ADMIN: [
    { id: 'overview', label: 'Dashboard', icon: Activity, href: '/dashboard' },
    { id: 'events', label: 'Events', icon: Calendar, href: '/events' },
    { id: 'users', label: 'Users', icon: Users, href: '/users' },
    { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon, href: '/monitoring' },
    { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert, href: '/emergency' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, href: '/alerts' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ],
  ORGANIZER: [
    { id: 'overview', label: 'Dashboard', icon: Activity, href: '/dashboard' },
    { id: 'events', label: 'Events', icon: Calendar, href: '/events' },
    { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon, href: '/monitoring' },
    { id: 'volunteers', label: 'Volunteers', icon: Users, href: '/volunteers' },
    { id: 'emergency', label: 'Emergency', icon: ShieldAlert, href: '/emergency' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, href: '/alerts' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ],
  VOLUNTEER: [
    { id: 'volunteer-duty', label: 'Dashboard', icon: Shield, href: '/dashboard' },
    { id: 'cameras', label: 'Monitoring', icon: CameraIcon, href: '/monitoring' },
    { id: 'emergency', label: 'SOS', icon: ShieldAlert, href: '/emergency' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ],
  PUBLIC: [
    { id: 'public-home', label: 'Home', icon: Home, href: '/dashboard' },
    { id: 'public-sos', label: 'SOS', icon: ShieldAlert, href: '/emergency' },
    { id: 'public-report', label: 'Report Incident', icon: Send, href: '/report' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ],
};

export function getNavForRole(role?: string | null): NavItem[] {
  if (!role) return [];
  return NAV_BY_ROLE[role] || [];
}

export function canAccessTab(role: string | null | undefined, tabId: string): boolean {
  return getNavForRole(role).some((item) => item.id === tabId);
}

/** Where a role lands after login, and where it is sent if it hits a module it cannot reach. */
export function getHomeForRole(role?: string | null): string {
  return getNavForRole(role)[0]?.href ?? '/login';
}

export function canAccessPath(role: string | null | undefined, path: string): boolean {
  return getNavForRole(role).some((item) => item.href === path);
}

/** Which body section to render for a URL. Roles share hrefs (`/dashboard` is
 *  `overview` for an admin but `volunteer-duty` for a volunteer), so the role
 *  picks the section, not the path alone. */
export function tabForPath(role: string | null | undefined, path: string): string | null {
  return getNavForRole(role).find((item) => item.href === path)?.id ?? null;
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getRiskColor(level: string) {
  switch (level) {
    case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}
