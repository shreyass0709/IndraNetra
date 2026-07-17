/**
 * Request validation for the auth endpoints.
 *
 * These are the trust boundary: everything here arrives from the public internet.
 * The global ValidationPipe (main.ts) runs with `whitelist: true`, which strips any
 * property not declared below -- that is what stops a caller from posting
 * `{ ..., isApproved: true }` and approving their own organizer account.
 */

import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Role } from '@prisma/client';

// At least 8 characters, with at least one letter and one number.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password needs at least 8 characters with a letter and a number.';

// bcrypt only reads the first 72 bytes and silently ignores the rest, which would
// make a 200-character password no stronger than its first 72 bytes. Reject long
// passwords outright rather than quietly truncating them.
const PASSWORD_MAX = 72;

// Roles a stranger may pick for themselves. ADMIN is absent by design: it is granted
// by seeding or by an existing admin, never by self-signup.
const SELF_SERVICE_ROLES = [Role.PUBLIC, Role.VOLUNTEER, Role.ORGANIZER];

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Transform(normalizeEmail)
  email: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 80, { message: 'Name must be between 2 and 80 characters.' })
  name: string;

  @IsString()
  @MaxLength(PASSWORD_MAX, { message: `Password must be ${PASSWORD_MAX} characters or fewer.` })
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;

  @IsOptional()
  @IsIn(SELF_SERVICE_ROLES, {
    message: 'Choose one of: attendee, volunteer, or event organizer.',
  })
  role?: Role;
}

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Transform(normalizeEmail)
  email: string;

  // No format rule here on purpose: login must accept whatever the account already
  // has. Enforcing the current policy at login would lock out older accounts.
  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsOptional()
  @IsIn(SELF_SERVICE_ROLES, {
    message: 'Choose one of: attendee, volunteer, or event organizer.',
  })
  role?: Role;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @Transform(normalizeEmail)
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MaxLength(PASSWORD_MAX, { message: `Password must be ${PASSWORD_MAX} characters or fewer.` })
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
