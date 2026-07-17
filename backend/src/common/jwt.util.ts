/**
 * Session token signing/verification.
 *
 * Both the signer (AuthService) and the verifier (AuthGuard) used to inline
 * `process.env.JWT_SECRET || 'supersafesecretkeyforindranetra123456'`. A fallback
 * secret that lives in source control is the same as no secret at all: anyone
 * holding the repo can forge a token for any role, including ADMIN. There is no
 * fallback here on purpose -- a missing secret is a boot failure, not a default.
 */

import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Sessions last a day. The cookie's maxAge is derived from this same constant so
// the cookie and the token can never disagree about when the session ends.
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

// Secrets that shipped in source control at some point. They are public knowledge
// now, so refuse them even if someone pastes one back into .env.
const BURNED_SECRETS = new Set(['supersafesecretkeyforindranetra123456']);

const MIN_SECRET_LENGTH = 32;

export interface SessionClaims {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Reads and validates JWT_SECRET. Throws rather than falling back.
 * Call once at boot (see main.ts) so a misconfigured deploy fails immediately
 * instead of serving traffic that only breaks when someone tries to log in.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Generate one with:\n' +
        "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"\n" +
        'and add it to backend/.env',
    );
  }

  if (BURNED_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET is set to a value that was committed to this repository, so it is ' +
        'public. Anyone with the source could forge an admin session. Generate a new one:\n' +
        "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${secret.length}).`,
    );
  }

  return secret;
}

export function signSession(user: SessionClaims): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    getJwtSecret(),
    { expiresIn: SESSION_TTL_SECONDS },
  );
}

export function verifySession(token: string): SessionClaims {
  return jwt.verify(token, getJwtSecret()) as SessionClaims;
}
