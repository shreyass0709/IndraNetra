import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

/**
 * ThrottlerGuard with a message a person can act on.
 *
 * The stock guard replies "ThrottlerException: Too Many Requests", which names an
 * internal class and tells the user nothing about what to do next.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _detail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException('Too many attempts. Please wait a minute and try again.');
  }
}
