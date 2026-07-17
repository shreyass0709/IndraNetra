/**
 * Optimistic route protection.
 *
 * In Next.js 16 `middleware.ts` is renamed to `proxy.ts` and the exported function
 * is `proxy`. It runs on the nodejs runtime (edge is not supported here).
 *
 * IMPORTANT: this is NOT the authorization check. Per the Next.js authentication
 * guide, proxy runs on every request including prefetches, so it only reads the
 * cookie and never calls the backend. It decodes the JWT *without verifying the
 * signature*, which is fine for its only job: deciding whether to render a page or
 * redirect, so nobody sees a flash of a page they can't have.
 *
 * The real check is `requireRole()` in lib/session.ts, which asks the backend. A
 * forged cookie gets past this file and is then rejected there.
 */

import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'indranetra_session';

type Role = 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER' | 'PUBLIC';

// Route prefix -> roles allowed to see it. The role-specific prefixes are listed
// now and their pages arrive in Phase 2; guarding a route before it exists is
// harmless, forgetting to guard it later is not.
const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/organizer', roles: ['ORGANIZER'] },
  { prefix: '/volunteer', roles: ['VOLUNTEER'] },
  { prefix: '/public', roles: ['PUBLIC'] },
  { prefix: '/dashboard', roles: ['ADMIN', 'ORGANIZER', 'VOLUNTEER', 'PUBLIC'] },
  { prefix: '/profile', roles: ['ADMIN', 'ORGANIZER', 'VOLUNTEER', 'PUBLIC'] },
];

// Signing in again while already signed in just sends you home.
const AUTH_PAGES = ['/login', '/signup'];

// Each role has its own shell at /<role>/dashboard. Kept in step with homeForRole()
// in lib/session.ts, which is the version the server-side checks use.
function homeForRole(role: Role): string {
  return `/${role.toLowerCase()}/dashboard`;
}

/** Read the role out of the JWT body. No signature check -- see the file header. */
function readClaims(token: string | undefined): { role: Role; expired: boolean } | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims?.role) return null;

    return {
      role: claims.role as Role,
      expired: typeof claims.exp === 'number' && claims.exp * 1000 < Date.now(),
    };
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const claims = readClaims(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const signedIn = claims !== null && !claims.expired;

  if (AUTH_PAGES.includes(pathname)) {
    if (signedIn) {
      return NextResponse.redirect(new URL(homeForRole(claims.role), req.url));
    }
    return NextResponse.next();
  }

  const rule = ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (!rule) return NextResponse.next();

  if (!signedIn) {
    // Remember where they were headed so login can send them back.
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (!rule.roles.includes(claims.role)) {
    return NextResponse.redirect(new URL(homeForRole(claims.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals, the API proxy routes, and static files -- matching those
  // would run this on every image and script request for nothing.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
};
