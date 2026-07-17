/**
 * Server-side session access (the "Data Access Layer" pattern from the Next.js
 * authentication guide).
 *
 * Two rules this file exists to enforce:
 *
 * 1. The browser never decides who you are. The session cookie is httpOnly and
 *    signed by the backend; the only way to learn a user's role is to ask the
 *    backend (`/auth/me`). Nothing here trusts a JWT payload it decoded itself.
 *
 * 2. Auth checks belong next to the data, not in a layout. Layouts don't re-render
 *    on client-side navigation (Partial Rendering), so a check there is skipped on
 *    route changes. Every protected *page* calls requireRole() itself.
 *
 * `proxy.ts` does a cheap optimistic check to avoid rendering a flash of the wrong
 * page; it is a UX nicety, never the authority. This file is the authority.
 */

import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE_NAME = 'indranetra_session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type Role = 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER' | 'PUBLIC';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isApproved: boolean;
  needsProfileSetup: boolean;
  profile: unknown | null;
}

/**
 * The signed-in user, or null. Memoized per render pass with React's cache(), so a
 * page and its components can each call it without repeating the network round trip.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  // cookies() is async in Next 16 -- synchronous access was removed entirely.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      // Never cache a session lookup: a cached answer would hand one user's
      // identity to the next request.
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch {
    // Backend unreachable. Treat as signed out rather than crashing the page --
    // the user lands on /login, which is the honest outcome.
    return null;
  }
});

/** Where a role belongs after signing in. Each role has its own guarded shell. */
export function homeForRole(role: Role | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'ORGANIZER':
      return '/organizer/dashboard';
    case 'VOLUNTEER':
      return '/volunteer/dashboard';
    case 'PUBLIC':
      return '/public/dashboard';
    default:
      return '/login';
  }
}

/** Require any signed-in user. Redirects to /login when there isn't one. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

/**
 * Require a signed-in user holding one of `roles`.
 * Wrong role redirects to that user's own home rather than showing an error --
 * being in the wrong place is a navigation mistake, not a failure.
 */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();

  if (user.needsProfileSetup) redirect('/profile-setup');

  if (!roles.includes(user.role)) redirect(homeForRole(user.role));

  return user;
}
