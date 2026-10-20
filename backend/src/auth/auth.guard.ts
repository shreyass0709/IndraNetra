import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Resolves the session user from request headers: the `indranetra_session`
 * HTTP-only cookie, or `Authorization: Bearer` for developer API testing.
 * Returns null when there is no token; throws when the token is invalid.
 * Shared by AuthGuard (HTTP) and CrowdGateway (Socket.IO handshake).
 */
export function userFromHeaders(cookieHeader?: string, authHeader?: string): any | null {
  let token: string | null = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
      const parts = cookie.trim().split('=');
      const key = parts[0];
      const value = parts.slice(1).join('='); // handle values that contain '='
      acc[key] = value;
      return acc;
    }, {});
    token = cookies['indranetra_session'] || null;
  }

  if (!token && authHeader) {
    token = authHeader.split(' ')[1] || null;
  }

  if (!token) return null;

  const secret = process.env.JWT_SECRET || 'supersafesecretkeyforindranetra123456';
  return jwt.verify(token, secret);
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    let user: any;
    try {
      user = userFromHeaders(request.headers.cookie, request.headers.authorization);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!user) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    request.user = user;
    return true;
  }
}
