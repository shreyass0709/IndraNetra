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
}

/**
 * Single source of truth for which dashboard tabs each role can reach.
 * The sidebar renders exactly this list; tabs that have no other role guard
 * in their own JSX (e.g. `analytics`, `volunteers`, `alerts`) should also
 * check `canAccessTab` before rendering, so reachability never depends on
 * the nav array alone.
 */
export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ADMIN: [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon },
    { id: 'emergency', label: 'Emergency Center', icon: ShieldAlert },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ],
  ORGANIZER: [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'cameras', label: 'Live Monitoring', icon: CameraIcon },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'profile', label: 'Profile', icon: User },
  ],
  VOLUNTEER: [
    { id: 'volunteer-duty', label: 'Dashboard', icon: Shield },
    { id: 'cameras', label: 'Monitoring', icon: CameraIcon },
    { id: 'emergency', label: 'SOS', icon: ShieldAlert },
    { id: 'profile', label: 'Profile', icon: User },
  ],
  PUBLIC: [
    { id: 'public-home', label: 'Home', icon: Home },
    { id: 'public-sos', label: 'SOS', icon: ShieldAlert },
    { id: 'public-report', label: 'Report Incident', icon: Send },
    { id: 'profile', label: 'Profile', icon: User },
  ],
};

export function getNavForRole(role?: string | null): NavItem[] {
  if (!role) return [];
  return NAV_BY_ROLE[role] || [];
}

export function canAccessTab(role: string | null | undefined, tabId: string): boolean {
  return getNavForRole(role).some((item) => item.id === tabId);
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
