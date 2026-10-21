import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, Res, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  CompleteProfileDto,
  EmailDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
  UpdateRoleDto,
} from './auth.dto';

// Per-IP limits on the unauthenticated routes (brute force, and email sends via Resend).
const STRICT = { default: { limit: 5, ttl: 60_000 } };

// In production the cookie must be `secure` (HTTPS-only); browsers additionally
// require `sameSite: 'none'` whenever `secure` is true for cross-site requests.
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ('none' as const) : ('lax' as const),
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle(STRICT)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  @UseGuards(ThrottlerGuard)
  async verifyEmail(@Body() body: TokenDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(body);
    
    // Set HTTP-only cookie
    res.cookie('indranetra_session', result.token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove token from output body to satisfy security
    const { token, ...output } = result;
    return output;
  }

  @Post('google')
  @UseGuards(ThrottlerGuard)
  async googleLogin(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.googleLogin(body);
    
    // Set HTTP-only cookie
    res.cookie('indranetra_session', result.token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { token, ...output } = result;
    return output;
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle(STRICT)
  async forgotPassword(@Body() body: EmailDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('complete-profile')
  @UseGuards(AuthGuard)
  async completeProfile(
    @Request() req: any,
    @Body() body: CompleteProfileDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.completeProfile(req.user.id, body.profileData);
    
    // Set HTTP-only cookie with updated role token
    res.cookie('indranetra_session', result.token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { token, ...output } = result;
    return output;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('indranetra_session', SESSION_COOKIE_OPTIONS);
    return { message: 'Logged out successfully' };
  }

  @Get('pending-organizers')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPendingOrganizers() {
    return this.authService.getPendingOrganizers();
  }

  @Post('approve-organizer/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveOrganizer(@Param('id') id: string) {
    return this.authService.approveOrganizer(id);
  }

  @Post('reject-organizer/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectOrganizer(@Param('id') id: string) {
    return this.authService.rejectOrganizer(id);
  }

  @Get('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
  ) {
    return this.authService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
