'use client';

/**
 * Client-side view of the signed-in user, for shell chrome (header, profile menu).
 *
 * The AUTHORITY on who you are is still the server -- every protected page calls
 * requireRole() in lib/session.ts, which the backend answers. This hook is only for
 * client components that need to *show* the current user's name or sign them out; it
 * is never a security boundary. It reads /auth/me through the shared api client.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

export type Role = 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER' | 'PUBLIC';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isApproved: boolean;
  needsProfileSetup: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    // Clear the cookie server-side first; ignore a failed call and leave anyway so a
    // backend hiccup can never trap someone in a signed-in UI.
    await api.logout().catch(() => {});
    router.push('/login');
    router.refresh();
  }, [router]);

  return { user, loading, logout };
}
