import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
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

export class ProfileDataDto {
  @IsOptional() @IsString() @MaxLength(30) phoneNumber?: string;
  @IsOptional() @IsString() @MaxLength(500) skills?: string;
  @IsOptional() @IsString() @MaxLength(500) availability?: string;
  @IsOptional() @IsString() @MaxLength(200) organizationName?: string;
  @IsOptional() @IsString() @MaxLength(100) designation?: string;
  @IsOptional() @IsString() @MaxLength(30) contactNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) emergencyContact?: string;
}

export class CompleteProfileDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileDataDto)
  profileData: ProfileDataDto;
}

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}
