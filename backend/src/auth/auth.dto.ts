import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  // Upper bound because bcrypt silently ignores bytes past 72.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class TokenDto {
  @IsString()
  token: string;
}

export class EmailDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  // Plaintext new password; the field name is what the frontend already sends.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordHash: string;
}
