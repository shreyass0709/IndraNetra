import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifySession } from '../common/jwt.util';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from HTTP Only cookie
    const cookieHeader = request.headers.cookie;
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

    // Fallback to Authorization Header (optional, for developer API testing)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader) {
        token = authHeader.split(' ')[1] || null;
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      request.user = verifySession(token);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
  }
}
